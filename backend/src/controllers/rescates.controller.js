const { validationResult } = require('express-validator');
const rescatesService = require('../services/rescates.service');

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

    const rescate = await rescatesService.create(req.body, req.user.id_usuario);

    res.status(201).json({
      success: true,
      data: rescate,
      message: 'Rescate registrado exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const result = await rescatesService.list(req.user, req.query);

    res.json({
      success: true,
      data: result,
      message: 'Rescates obtenidos exitosamente',
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

    const rescate = await rescatesService.getById(req.params.id, req.user);

    res.json({
      success: true,
      data: rescate,
      message: 'Rescate obtenido exitosamente',
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

    const rescate = await rescatesService.update(req.params.id, req.body, req.user);
    res.json({
      success: true,
      data: rescate,
      message: 'Rescate actualizado exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    await rescatesService.remove(req.params.id, req.user);
    res.json({
      success: true,
      data: null,
      message: 'Rescate eliminado exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, update, remove };
