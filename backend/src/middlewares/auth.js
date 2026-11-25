const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const pool = require('../config/db');

/**
 * Verifies the JWT access token and checks that the user remains active in DB.
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Token de acceso no proporcionado',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    const userCheck = await pool.query(
      `SELECT id_usuario, rol, estado FROM usuarios WHERE id_usuario = $1`,
      [decoded.id_usuario]
    );

    if (userCheck.rows.length === 0) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Usuario no encontrado',
      });
    }

    const dbUser = userCheck.rows[0];
    if (dbUser.estado !== 'activo') {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Tu cuenta está inactiva o suspendida. Contacta al administrador.',
      });
    }

    req.user = { id_usuario: dbUser.id_usuario, rol: dbUser.rol };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'La sesión ha expirado. Inicia sesión nuevamente.',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Token inválido',
      });
    }
    next(err);
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Autenticación requerida',
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'No tienes permisos para realizar esta acción',
      });
    }

    next();
  };
};

module.exports = { verifyToken, requireRole };
