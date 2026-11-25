const { Router } = require('express');
const { param } = require('express-validator');
const mascotasController = require('../controllers/mascotas.controller');
const expedientesController = require('../controllers/expedientes.controller');
const {
  createMascotaValidator,
  updateMascotaValidator,
  listMascotasValidator,
  idParamValidator,
} = require('../validators/mascotas.validator');
const { createExpedienteValidator } = require('../validators/expedientes.validator');
const { verifyToken, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = Router();

router.get('/', listMascotasValidator, mascotasController.list);
router.get('/:id', idParamValidator, mascotasController.getById);

router.post(
  '/',
  verifyToken,
  requireRole('rescatista', 'veterinario', 'administrador'),
  createMascotaValidator,
  mascotasController.create
);

router.put(
  '/:id',
  verifyToken,
  requireRole('rescatista', 'veterinario', 'administrador'),
  updateMascotaValidator,
  mascotasController.update
);

router.patch(
  '/:id',
  verifyToken,
  requireRole('rescatista', 'veterinario', 'administrador'),
  updateMascotaValidator,
  mascotasController.update
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('rescatista', 'administrador'),
  idParamValidator,
  mascotasController.remove
);

router.post(
  '/:id/fotos',
  verifyToken,
  requireRole('rescatista', 'veterinario', 'administrador'),
  idParamValidator,
  upload.fields([
    { name: 'foto', maxCount: 5 },
    { name: 'fotos', maxCount: 5 },
  ]),
  mascotasController.uploadPhotos
);

router.patch(
  '/:id/fotos/:fotoId/principal',
  verifyToken,
  requireRole('rescatista', 'veterinario', 'administrador'),
  [
    param('id').isInt({ min: 1 }).withMessage('ID de mascota inválido'),
    param('fotoId').isInt({ min: 1 }).withMessage('ID de foto inválido'),
  ],
  mascotasController.setPrincipalPhoto
);

router.delete(
  '/:id/fotos/:fotoId',
  verifyToken,
  requireRole('rescatista', 'veterinario', 'administrador'),
  [
    param('id').isInt({ min: 1 }).withMessage('ID de mascota inválido'),
    param('fotoId').isInt({ min: 1 }).withMessage('ID de foto inválido'),
  ],
  mascotasController.deletePhoto
);

router.get('/:id/expediente', verifyToken, idParamValidator, expedientesController.getByMascota);

router.post(
  '/:id/expediente',
  verifyToken,
  requireRole('veterinario', 'administrador'),
  (req, _res, next) => {
    req.body.id_mascota = parseInt(req.params.id, 10);
    next();
  },
  createExpedienteValidator,
  expedientesController.create
);

module.exports = router;
