const { validationResult } = require('express-validator');
const solicitudesService = require('../services/solicitudes.service');

async function create(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const solicitud = await solicitudesService.create(req.body, req.user.id_usuario);

    res.status(201).json({
      success: true,
      data: solicitud,
      message: 'Solicitud de adopción creada exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const result = await solicitudesService.list(req.user, req.query);

    res.json({
      success: true,
      data: result,
      message: 'Solicitudes obtenidas exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const solicitud = await solicitudesService.getById(req.params.id, req.user);

    res.json({
      success: true,
      data: solicitud,
      message: 'Solicitud obtenida exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function evaluate(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const solicitud = await solicitudesService.evaluate(req.params.id, req.body, req.user);

    res.json({
      success: true,
      data: solicitud,
      message: 'Solicitud evaluada exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function createCita(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const cita = await solicitudesService.createCita(req.params.id, req.body, req.user);

    res.status(201).json({
      success: true,
      data: cita,
      message: 'Cita programada exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function updateCitaEstado(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const cita = await solicitudesService.updateCitaEstado(
      req.params.id,
      req.params.citaId,
      req.body.estado,
      req.user
    );

    res.json({
      success: true,
      data: cita,
      message: 'Estado de la cita actualizado',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, evaluate, createCita, updateCitaEstado };
