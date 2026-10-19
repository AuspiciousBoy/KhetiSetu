const express = require('express');
const router = express.Router();
const logisticsController = require('../../controllers/logisticsController');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

// Deliveries
router.get('/deliveries', authorize('ADMIN', 'LOGISTICS_OPERATOR', 'FARMER'), logisticsController.listDeliveries);
router.post('/deliveries/:id/status', logisticsController.updateStatus);
router.post('/deliveries/:id/assign', authorize('ADMIN', 'LOGISTICS_OPERATOR'), logisticsController.assignVehicle);

// Vehicles
router.get('/vehicles', authorize('ADMIN', 'LOGISTICS_OPERATOR'), logisticsController.listVehicles);
router.post('/vehicles', authorize('ADMIN'), logisticsController.createVehicle);

module.exports = router;
