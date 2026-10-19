const logisticsService = require('../services/logisticsService');
const Vehicle = require('../models/Vehicle');
const { success, paginated } = require('../utils/response');

const updateStatus = async (req, res, next) => {
  try {
    const delivery = await logisticsService.updateDeliveryStatus({
      deliveryId: req.params.id,
      newStatus: req.body.status,
      location: req.body.location,
      note: req.body.note,
      operatorId: req.user.id,
      actorRole: req.user.role,
      req,
    });
    return success(res, delivery, 'Delivery status transitioned successfully');
  } catch (err) {
    next(err);
  }
};

const assignVehicle = async (req, res, next) => {
  try {
    const delivery = await logisticsService.assignVehicle({
      deliveryId: req.params.id,
      vehicleId: req.body.vehicleId,
      req,
    });
    return success(res, delivery, 'Logistics vehicle assigned successfully');
  } catch (err) {
    next(err);
  }
};

const listDeliveries = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await logisticsService.listDeliveries({
      page: Number(page),
      limit: Number(limit),
      status,
    });
    return paginated(res, result.deliveries, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
};

const listVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ isActive: true });
    return success(res, vehicles);
  } catch (err) {
    next(err);
  }
};

const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    return success(res, vehicle, 'Logistics vehicle registered', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateStatus,
  assignVehicle,
  listDeliveries,
  listVehicles,
  createVehicle,
};
