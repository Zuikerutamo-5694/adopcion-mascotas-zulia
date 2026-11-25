const { validationResult } = require('express-validator');
const expedientesService = require('../services/expedientes.service');

async function listOverview(req, res, next) {
  try {
    const items = await expedientesService.listOverview(req.query);
    res.json({
      success: true,
      data: items,
      message: 'Resumen clínico obtenido exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

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

    const expediente = await expedientesService.create(req.body, req.user.id_usuario);

    res.status(201).json({
      success: true,
      data: expediente,
      message: 'Expediente médico creado exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function getByMascota(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const expedientes = await expedientesService.getByMascota(req.params.id);

    res.json({
      success: true,
      data: expedientes,
      message: 'Expedientes obtenidos exitosamente',
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

    const expediente = await expedientesService.getById(req.params.id);

    res.json({
      success: true,
      data: expediente,
      message: 'Expediente obtenido exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const expediente = await expedientesService.update(
      req.params.id,
      req.body,
      req.user.id_usuario
    );

    res.json({
      success: true,
      data: expediente,
      message: 'Expediente actualizado exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listOverview, create, getByMascota, getById, update };
