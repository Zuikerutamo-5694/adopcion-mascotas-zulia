const { body } = require('express-validator');

const normalizeTipoVivienda = (val) => {
  if (!val) return undefined;
  const map = {
    casa_patio: 'casa',
    casa_sin_patio: 'casa',
    casa: 'casa',
    apartamento: 'apartamento',
    quinta: 'quinta',
    finca: 'finca',
    otro: 'otro',
  };
  return map[val] || 'otro';
};

const registerValidator = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 120 }).withMessage('El nombre no puede exceder 120 caracteres'),

  body('correo')
    .custom((val, { req }) => {
      const email = val || req.body.email;
      if (!email || !/^\S+@\S+\.\S+$/.test(String(email).trim())) {
        throw new Error('Ingresa un correo electrónico válido');
      }
      req.body.correo = String(email).trim().toLowerCase();
      return true;
    }),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),

  body('telefono')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 }).withMessage('El teléfono no puede exceder 20 caracteres'),

  body('direccion')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 300 }).withMessage('La dirección no puede exceder 300 caracteres'),

  // Seguridad: el registro público NO permite crear cuentas de administrador
  body('rol')
    .notEmpty().withMessage('El rol es obligatorio')
    .isIn(['veterinario', 'rescatista', 'adoptante'])
    .withMessage('Rol inválido para registro público'),

  body('ingresos_aproximados')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 }).withMessage('Los ingresos deben ser un número positivo'),

  body('tipo_vivienda')
    .optional({ values: 'falsy' })
    .customSanitizer(normalizeTipoVivienda)
    .isIn(['casa', 'apartamento', 'quinta', 'finca', 'otro'])
    .withMessage('Tipo de vivienda inválido'),

  body('tiene_jardin')
    .optional()
    .isBoolean().withMessage('tiene_jardin debe ser booleano'),

  body('organizacion')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 }).withMessage('La organización no puede exceder 200 caracteres'),

  body('zona_rescate')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 }).withMessage('La zona de rescate no puede exceder 200 caracteres'),

  body('numero_licencia')
    .custom((val, { req }) => {
      const lic = (val || req.body.licencia || '').trim();
      if (req.body.rol === 'veterinario' && !lic) {
        throw new Error('El número de licencia profesional es obligatorio para veterinarios');
      }
      if (lic.length > 50) {
        throw new Error('El número de licencia no puede exceder 50 caracteres');
      }
      if (lic) req.body.numero_licencia = lic;
      return true;
    }),

  body('clinica_asociada')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 }).withMessage('La clínica no puede exceder 200 caracteres'),

  body('especialidad')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 150 }).withMessage('La especialidad no puede exceder 150 caracteres'),

  body('experiencia')
    .optional({ values: 'falsy' })
    .trim(),
];

const loginValidator = [
  body('correo')
    .custom((val, { req }) => {
      const email = val || req.body.email;
      if (!email) {
        throw new Error('El correo es obligatorio');
      }
      req.body.correo = String(email).trim().toLowerCase();
      return true;
    }),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),
];

const updateProfileValidator = [
  body('nombre')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ max: 120 }).withMessage('El nombre no puede exceder 120 caracteres'),

  body('telefono')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 20 }).withMessage('El teléfono no puede exceder 20 caracteres'),

  body('direccion')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 300 }).withMessage('La dirección no puede exceder 300 caracteres'),

  body('ingresos_aproximados')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 }).withMessage('Los ingresos deben ser un número positivo'),

  body('tipo_vivienda')
    .optional({ values: 'falsy' })
    .customSanitizer(normalizeTipoVivienda)
    .isIn(['casa', 'apartamento', 'quinta', 'finca', 'otro'])
    .withMessage('Tipo de vivienda inválido'),

  body('tiene_jardin')
    .optional()
    .isBoolean().withMessage('tiene_jardin debe ser booleano'),

  body('organizacion')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 }),

  body('zona_rescate')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 }),

  body('numero_licencia')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 50 }),

  body('clinica_asociada')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 }),

  body('especialidad')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 150 }),
];

module.exports = { registerValidator, loginValidator, updateProfileValidator };
