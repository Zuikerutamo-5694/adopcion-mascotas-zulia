const { validationResult } = require('express-validator');
const adminService = require('../services/admin.service');

async function getReports(_req, res, next) {
  try {
    const reports = await adminService.getReports();

    res.json({
      success: true,
      data: reports,
      message: 'Reportes generados exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const result = await adminService.listUsers(req.query);

    res.json({
      success: true,
      data: result,
      message: 'Usuarios obtenidos exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const { estado } = req.body;
    const user = await adminService.updateUserStatus(
      req.params.id,
      estado,
      req.user.id_usuario
    );

    res.json({
      success: true,
      data: user,
      message: 'Estado del usuario actualizado exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getReports, listUsers, updateUserStatus };
