const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
      message: 'Usuario registrado exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const { correo, password } = req.body;
    const result = await authService.login(correo, password);

    res.json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
      message: 'Inicio de sesión exitoso',
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id_usuario);

    res.json({
      success: true,
      data: user,
      message: 'Perfil obtenido exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const user = await authService.updateMe(req.user.id_usuario, req.body);

    res.json({
      success: true,
      data: user,
      message: 'Perfil actualizado exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, updateMe };
