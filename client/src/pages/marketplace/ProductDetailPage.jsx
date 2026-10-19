import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ProgressRing from '../../components/ui/ProgressRing';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/marketplace/products/${id}`);
        setProduct(res.data.data);
        setQuantity(res.data.data.minOrderQuantity || 1);
      } catch (err) {
        console.error('Failed to load product detail', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleInstantCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setOrdering(true);
    try {
      // Direct checkout for quick ordering
      const res = await apiClient.post('/orders', {
        items: [{ productId: product.id, quantity: Number(quantity) }],
        deliveryAddress: {
          fullName: user.fullName || 'Registered Buyer',
          phone: user.phone || '+91 98765 43210',
          line1: 'Primary Delivery Destination',
          city: 'Pune',
          district: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
        },
        paymentMethod: 'UPI',
      });

      navigate('/consumer/orders');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Order creation failed');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
        <Skeleton className="h-96 rounded-[24px]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 text-center">
        <p className="text-sm text-on-surface-variant">Produce item not found.</p>
        <Link to="/marketplace" className="text-xs text-primary font-bold underline mt-2 inline-block">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 flex flex-col gap-10">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Link to="/marketplace" className="hover:text-primary">
          Marketplace
        </Link>
        <span>/</span>
        <span className="text-primary font-medium">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Produce Image Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="rounded-[24px] overflow-hidden border border-surface-variant soil-shadow h-96 sm:h-[480px]">
            <img
              src={
                product.images?.[0] ||
                'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=1200'
              }
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* AI Quality Verification Banner */}
          {product.qualityAssessment && (
            <Card className="bg-surface-container-low p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-surface-variant/60 pb-3">
                <div className="flex items-center gap-3">
                  <ProgressRing
                    progress={Math.round((product.qualityAssessment.confidence || 0.9) * 100)}
                    size={48}
                    strokeWidth={5}
                  />
                  <div>
                    <h4 className="font-display font-semibold text-primary text-sm">
                      AI Verified Quality Grade: {product.qualityAssessment.classification.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-[11px] text-on-surface-variant">
                      Assessed on {new Date(product.qualityAssessment.assessedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant="success">Confidence {Math.round((product.qualityAssessment.confidence || 0.9) * 100)}%</Badge>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-secondary block mb-1">
                  Morphological Observations:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-on-surface">
                  {product.qualityAssessment.observations?.map((obs, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-primary">check</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[10px] text-on-surface-variant italic border-t border-surface-variant/40 pt-2">
                {product.qualityAssessment.disclaimer}
              </p>
            </Card>
          )}
        </div>

        {/* Right Column: Purchasing & Batch Traceability Details */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="p-8 flex flex-col gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="warning">{product.category}</Badge>
                <span className="text-xs text-on-surface-variant">
                  📍 {product.location?.district}, {product.location?.state}
                </span>
              </div>

              <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mb-2">
                {product.title}
              </h1>

              <div className="flex items-baseline gap-2 mt-4">
                <span className="font-display font-bold text-4xl text-primary">
                  ₹{product.pricePerUnit}
                </span>
                <span className="text-sm text-on-surface-variant font-medium">
                  / {product.unit} (Inclusive of farm handling)
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {product.description}
            </p>

            {/* Farm-Gate Traceability Metadata Card */}
            {product.batchTraceability && (
              <div className="p-4 rounded-[16px] bg-surface-container border border-surface-variant/60 flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between font-mono font-bold text-primary">
                  <span>Batch Code:</span>
                  <span>{product.batchTraceability.batchId}</span>
                </div>
                <div className="flex items-center justify-between text-on-surface">
                  <span>Harvest Date:</span>
                  <span>{new Date(product.batchTraceability.harvestDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-on-surface">
                  <span>Storage Protocol:</span>
                  <span>{product.batchTraceability.storageMethod || 'Ventilated Farm Storage'}</span>
                </div>
                <div className="flex items-center justify-between text-on-surface">
                  <span>Projected Shelf-Life:</span>
                  <span className="font-semibold text-secondary">
                    {product.batchTraceability.shelfLifeDays} Days
                  </span>
                </div>
              </div>
            )}

            {/* Quantity Stepper & Buy Action */}
            <div className="pt-4 border-t border-surface-variant/60 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface">Order Quantity:</span>
                <div className="flex items-center gap-3 bg-surface-container rounded-full px-3 py-1 border border-surface-variant">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(product.minOrderQuantity, prev - 1))}
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-primary hover:bg-surface-variant"
                  >
                    -
                  </button>
                  <span className="font-semibold text-sm text-primary w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.min(product.availableQuantity, prev + 1))}
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-primary hover:bg-surface-variant"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Total Value (approx):</span>
                <span className="font-display font-bold text-xl text-primary">
                  ₹{product.pricePerUnit * quantity}
                </span>
              </div>

              <Button
                variant="primary"
                size="lg"
                loading={ordering}
                onClick={handleInstantCheckout}
                className="w-full mt-2"
              >
                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                {isAuthenticated ? 'Direct Checkout & Dispatch' : 'Sign in to Place Order'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
