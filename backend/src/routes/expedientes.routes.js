const { Router } = require('express');
const expedientesController = require('../controllers/expedientes.controller');
const {
  createExpedienteValidator,
  updateExpedienteValidator,
  idParamValidator,
} = require('../validators/expedientes.validator');
const { verifyToken, requireRole } = require('../middlewares/auth');

const router = Router();

// GET /api/expedientes – Bandeja clínica general (mascotas + último expediente)
router.get(
  '/',
  verifyToken,
  requireRole('veterinario', 'administrador'),
  expedientesController.listOverview
);

// POST /api/expedientes
router.post(
  '/',
  verifyToken,
  requireRole('veterinario', 'administrador'),
  createExpedienteValidator,
  expedientesController.create
);

// GET /api/expedientes/mascota/:id
router.get(
  '/mascota/:id',
  verifyToken,
  idParamValidator,
  expedientesController.getByMascota
);

// GET /api/expedientes/:id
router.get(
  '/:id',
  verifyToken,
  idParamValidator,
  expedientesController.getById
);

// PUT /api/expedientes/:id
router.put(
  '/:id',
  verifyToken,
  requireRole('veterinario', 'administrador'),
  updateExpedienteValidator,
  expedientesController.update
);

module.exports = router;
