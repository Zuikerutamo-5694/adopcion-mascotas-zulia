const { Router } = require('express');
const rescatesController = require('../controllers/rescates.controller');
const { verifyToken, requireRole } = require('../middlewares/auth');
const { body, param } = require('express-validator');

const router = Router();

const createOrUpdateRescateValidator = [
  body('ubicacion')
    .trim()
    .notEmpty().withMessage('La ubicación es obligatoria')
    .isLength({ max: 300 }).withMessage('La ubicación no puede exceder 300 caracteres'),

  body('fecha_rescate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('La fecha de rescate debe tener formato AAAA-MM-DD'),

  body('notas')
    .custom((val, { req }) => {
      req.body.notas = (val || req.body.descripcion || '').trim() || null;
      req.body.condicion_inicial = (req.body.condicion_inicial || req.body.condicion || '').trim() || null;
      req.body.observaciones = (req.body.observaciones || '').trim() || null;
      return true;
    }),
];

const idParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
];

router.post(
  '/',
  verifyToken,
  requireRole('rescatista', 'administrador'),
  createOrUpdateRescateValidator,
  rescatesController.create
);

router.get(
  '/',
  verifyToken,
  requireRole('rescatista', 'veterinario', 'administrador'),
  rescatesController.list
);

router.get(
  '/:id',
  verifyToken,
  requireRole('rescatista', 'veterinario', 'administrador'),
  idParamValidator,
  rescatesController.getById
);

router.put(
  '/:id',
  verifyToken,
  requireRole('rescatista', 'administrador'),
  idParamValidator,
  createOrUpdateRescateValidator,
  rescatesController.update
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('rescatista', 'administrador'),
  idParamValidator,
  rescatesController.remove
);

module.exports = router;
