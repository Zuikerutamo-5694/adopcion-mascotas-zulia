const { Router } = require('express');
const solicitudesController = require('../controllers/solicitudes.controller');
const {
  createSolicitudValidator,
  evaluateSolicitudValidator,
  createCitaValidator,
  updateCitaEstadoValidator,
  idParamValidator,
} = require('../validators/solicitudes.validator');
const { verifyToken, requireRole } = require('../middlewares/auth');

const router = Router();

router.post(
  '/',
  verifyToken,
  requireRole('adoptante'),
  createSolicitudValidator,
  solicitudesController.create
);

router.get(
  '/',
  verifyToken,
  requireRole('adoptante', 'rescatista', 'administrador'),
  solicitudesController.list
);

router.get(
  '/:id',
  verifyToken,
  requireRole('adoptante', 'rescatista', 'administrador'),
  idParamValidator,
  solicitudesController.getById
);

router.patch(
  '/:id/evaluar',
  verifyToken,
  requireRole('rescatista', 'administrador'),
  evaluateSolicitudValidator,
  solicitudesController.evaluate
);

router.post(
  '/:id/citas',
  verifyToken,
  requireRole('rescatista', 'administrador', 'adoptante'),
  createCitaValidator,
  solicitudesController.createCita
);

router.patch(
  '/:id/citas/:citaId',
  verifyToken,
  requireRole('rescatista', 'administrador', 'adoptante'),
  updateCitaEstadoValidator,
  solicitudesController.updateCitaEstado
);

module.exports = router;
