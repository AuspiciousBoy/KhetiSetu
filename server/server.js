const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const mongoose = require('mongoose');

const { PORT, NODE_ENV, UPLOAD_DIR, isProd } = require('./config/env');
const { connectDB } = require('./config/db');
const helmetConfig = require('./config/helmetConfig');
const corsOptions = require('./config/corsConfig');
const { globalLimiter } = require('./config/rateLimits');
const requestIdMiddleware = require('./middleware/requestId');
const { mongoSanitizer } = require('./security/mongoSanitizer');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const Media = require('./models/Media');
const Product = require('./models/Product');
const ProduceBatch = require('./models/ProduceBatch');
const QualityAssessment = require('./models/QualityAssessment');
const v1Router = require('./routes/v1');

const app = express();

// Trust reverse proxy (nginx, load balancer) in production
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// 1. Security Headers
app.use(helmetConfig);

// 2. Strict CORS
app.use(cors(corsOptions));

// 3. Request Correlation ID
app.use(requestIdMiddleware);

// 4. Request Logging (exclude static uploads from spamming logs)
const morganStream = {
  write: (message) => logger.info(message.trim()),
};
app.use(
  morgan(
    ':remote-addr - :method :url :status :res[content-length] - :response-time ms',
    { stream: morganStream, skip: (req) => req.url.startsWith('/uploads') }
  )
);

// 5. Body Parsing with strict Resource Exhaustion limits (10kb)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 6. NoSQL Injection Sanitization
app.use(mongoSanitizer);

// 7. Global API Rate Limiter
app.use(globalLimiter);

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 8. Static & Database-Backed Uploads (Serving produce photos, farmer QR codes, and payment proofs)
const serveMediaFile = async (req, res, next) => {
  try {
    const rawFilename = req.params.filename || (req.url.replace(/^\/+/, '').split('?')[0]);
    if (!rawFilename) return next();

    const filename = path.basename(rawFilename);
    const localFilePath = path.join(UPLOAD_DIR, filename);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // 1. Fast Path: File exists on local container disk cache
    if (fs.existsSync(localFilePath)) {
      return res.sendFile(localFilePath);
    }

    // 2. Persistent Path: Retrieve binary buffer directly from MongoDB Atlas
    const media = await Media.findOne({ filename });
    if (media && media.data) {
      // Re-hydrate local container disk cache asynchronously
      fs.promises.writeFile(localFilePath, media.data).catch(() => {});

      res.setHeader('Content-Type', media.mimeType || 'image/jpeg');
      res.setHeader('Content-Length', media.data.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(media.data);
    }

    return next();
  } catch (err) {
    logger.error('Error serving media from database:', { error: err.message });
    return next();
  }
};

app.get(
  ['/uploads/:filename', '/api/v1/uploads/:filename', '/api/uploads/:filename'],
  serveMediaFile
);

app.use(
  ['/uploads', '/api/v1/uploads', '/api/uploads'],
  (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(UPLOAD_DIR, { maxAge: '1d', etag: true })
);

// 9. Health & Readiness Probes (Kubernetes / Docker compatible)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0',
    requestId: req.id,
  });
});

app.get('/ready', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  if (!dbReady) {
    return res.status(503).json({
      status: 'NOT_READY',
      database: 'DISCONNECTED',
      requestId: req.id,
    });
  }
  res.status(200).json({
    status: 'READY',
    database: 'CONNECTED',
    requestId: req.id,
  });
});

// Database connection readiness check for API routes: prevents infinite buffering timeouts
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState === 0) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is currently disconnected. Please ensure MongoDB is running at 127.0.0.1:27017.',
        requestId: req.id,
      },
    });
  }
  next();
});

// 10. Mount API Version 1 (Includes /orders/:id/cancel, /farmer/listings/upload-image, /users/profile, /farmer/payment)
app.use('/api/v1', v1Router);

// 11. Serve Static Frontend (Production / Unified Single-Port Mode)
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // Single Page Application (SPA) client fallback for non-API routes (Express 5 compatible)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// 12. 404 Route Handler for unmatched API endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint '${req.method} ${req.originalUrl}' does not exist on KhetiSetu API.`,
      requestId: req.id,
    },
  });
});

// 12. Centralized Error Handler (Shields internals & stack traces)
app.use(errorHandler);

// Sync existing disk uploads into MongoDB Atlas (protects files across container teardowns)
const syncLocalUploadsToDatabase = async () => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) return;
    const files = await fs.promises.readdir(UPLOAD_DIR);
    for (const file of files) {
      const filePath = path.join(UPLOAD_DIR, file);
      const stat = await fs.promises.stat(filePath);
      if (stat.isFile() && stat.size > 0) {
        const existing = await Media.findOne({ filename: file }).select('_id');
        if (!existing) {
          const buffer = await fs.promises.readFile(filePath);
          const ext = path.extname(file).toLowerCase();
          const mimeType =
            ext === '.png'
              ? 'image/png'
              : ext === '.webp'
              ? 'image/webp'
              : 'image/jpeg';
          await Media.create({
            filename: file,
            originalName: file,
            mimeType,
            size: buffer.length,
            data: buffer,
          });
          logger.info(`Persisted existing disk upload into MongoDB Atlas: ${file}`);
        }
      }
    }
  } catch (err) {
    logger.warn('Non-blocking notice during uploads sync to MongoDB:', { error: err.message });
  }
};

// Heal legacy product listings where imageUrl was defaulted to generic placeholder
const healProductListingImages = async () => {
  try {
    const productsWithPlaceholder = await Product.find({
      $or: [
        { imageUrl: { $regex: 'unsplash.com', $options: 'i' } },
        { imageUrl: { $exists: false } },
        { imageUrl: '' },
      ],
    }).populate({
      path: 'batchId',
      populate: { path: 'qualityAssessmentId' },
    });

    for (const prod of productsWithPlaceholder) {
      const batchImg = prod.batchId?.qualityAssessmentId?.imageUrl;
      if (batchImg && !batchImg.includes('unsplash.com')) {
        await Product.updateOne(
          { _id: prod._id },
          { imageUrl: batchImg, images: [batchImg] }
        );
        logger.info(`Healed product '${prod.title}' image to farmer's uploaded batch photo: ${batchImg}`);
      }
    }
  } catch (err) {
    logger.warn('Non-blocking notice during product image healing:', { error: err.message });
  }
};

// Start Server and Database
const startServer = async () => {
  if (isProd) {
    await connectDB();
    await syncLocalUploadsToDatabase();
    await healProductListingImages();
  } else {
    connectDB()
      .then(async () => {
        await syncLocalUploadsToDatabase();
        await healProductListingImages();
      })
      .catch((err) => {
        logger.warn('Initial MongoDB connection deferred in dev mode', { error: err.message });
      });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`========================================================`);
    logger.info(`  KhetiSetu Production API Server Active`);
    logger.info(`  Listening on: http://127.0.0.1:${PORT} (0.0.0.0)`);
    logger.info(`  Environment:  ${NODE_ENV}`);
    logger.info(`  Health Probe: http://127.0.0.1:${PORT}/health`);
    logger.info(`========================================================`);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection caught at process level', {
      error: reason?.message || String(reason),
      stack: reason?.stack,
    });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception caught at process level', {
      error: err.message,
      stack: err.stack,
    });
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Auto-start if executed directly
if (require.main === module) {
  startServer().catch((err) => {
    logger.error('Fatal startup error', { error: err.message, stack: err.stack });
    process.exit(1);
  });
}

module.exports = app;
