const { body, param } = require('express-validator');

const createExpedienteValidator = [
  body('id_mascota')
    .custom((val, { req }) => {
      const id = val || req.body.mascotaId || req.params.id;
      if (!id || isNaN(parseInt(id, 10))) {
        throw new Error('El id de la mascota es obligatorio');
      }
      req.body.id_mascota = parseInt(id, 10);
      return true;
    }),

  body('peso')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 }).withMessage('El peso debe ser un número positivo'),

  body('temperatura')
    .optional({ values: 'falsy' })
    .isFloat({ min: 30, max: 46 }).withMessage('La temperatura debe estar entre 30 y 46 °C'),

  body('vacunas')
    .optional(),

  body('diagnostico')
    .trim()
    .notEmpty().withMessage('El diagnóstico clínico es obligatorio'),

  body('tratamientos')
    .custom((val, { req }) => {
      req.body.tratamientos = (val || req.body.tratamiento || '').trim() || null;
      req.body.observaciones = (req.body.observaciones || '').trim() || null;
      return true;
    }),
];

const updateExpedienteValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de expediente inválido'),

  body('peso')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 }).withMessage('El peso debe ser un número positivo'),

  body('temperatura')
    .optional({ values: 'falsy' })
    .isFloat({ min: 30, max: 46 }).withMessage('La temperatura debe estar entre 30 y 46 °C'),

  body('vacunas')
    .optional(),

  body('diagnostico')
    .optional()
    .trim(),

  body('tratamientos')
    .custom((val, { req }) => {
      const resolved = val !== undefined ? val : req.body.tratamiento;
      if (resolved !== undefined) {
        req.body.tratamientos = String(resolved).trim() || null;
      }
      if (req.body.observaciones !== undefined) {
        req.body.observaciones = String(req.body.observaciones).trim() || null;
      }
      return true;
    }),
];

const idParamValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID inválido'),
];

module.exports = {
  createExpedienteValidator,
  updateExpedienteValidator,
  idParamValidator,
};
