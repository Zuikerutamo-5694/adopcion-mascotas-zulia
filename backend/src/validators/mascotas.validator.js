const { body, query, param } = require('express-validator');

const ESTADOS_VALIDOS = ['en_rescate', 'en_tratamiento', 'en_adopcion', 'en_proceso', 'adoptada'];

const normalizeEstado = (val) => {
  if (!val) return val;
  if (val === 'disponible') return 'en_adopcion';
  if (val === 'adoptado') return 'adoptada';
  return val;
};

const createMascotaValidator = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),

  body('especie')
    .notEmpty().withMessage('La especie es obligatoria')
    .isIn(['perro', 'gato', 'conejo', 'ave', 'otro'])
    .withMessage('Especie inválida'),

  body('raza')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('La raza no puede exceder 100 caracteres'),

  body('edad_aprox')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 }).withMessage('La edad aproximada no puede exceder 50 caracteres'),

  body('peso')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 }).withMessage('El peso debe ser un número positivo'),

  body('sexo')
    .notEmpty().withMessage('El sexo es obligatorio')
    .isIn(['macho', 'hembra']).withMessage('Sexo inválido'),

  body('tamano')
    .notEmpty().withMessage('El tamaño es obligatorio')
    .isIn(['pequeno', 'mediano', 'grande']).withMessage('Tamaño inválido'),

  body('estado')
    .optional({ values: 'falsy' })
    .customSanitizer(normalizeEstado)
    .isIn(ESTADOS_VALIDOS)
    .withMessage('Estado inválido'),

  body('id_rescate')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('id_rescate debe ser un entero positivo'),
];

const updateMascotaValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de mascota inválido'),

  body('nombre')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),

  body('especie')
    .optional()
    .isIn(['perro', 'gato', 'conejo', 'ave', 'otro'])
    .withMessage('Especie inválida'),

  body('sexo')
    .optional()
    .isIn(['macho', 'hembra']).withMessage('Sexo inválido'),

  body('tamano')
    .optional()
    .isIn(['pequeno', 'mediano', 'grande']).withMessage('Tamaño inválido'),

  body('estado')
    .optional({ values: 'falsy' })
    .customSanitizer(normalizeEstado)
    .isIn(ESTADOS_VALIDOS)
    .withMessage('Estado inválido'),

  body('peso')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 }).withMessage('El peso debe ser un número positivo'),

  body('id_rescate')
    .optional({ nullable: true })
    .custom((val) => val === null || val === '' || (Number.isInteger(Number(val)) && Number(val) >= 1))
    .withMessage('id_rescate inválido'),
];

const listMascotasValidator = [
  query('especie')
    .optional({ values: 'falsy' })
    .isIn(['perro', 'gato', 'conejo', 'ave', 'otro'])
    .withMessage('Especie inválida'),

  query('estado')
    .optional({ values: 'falsy' })
    .customSanitizer(normalizeEstado)
    .isIn(ESTADOS_VALIDOS)
    .withMessage('Estado inválido'),

  query('tamano')
    .optional({ values: 'falsy' })
    .isIn(['pequeno', 'mediano', 'grande'])
    .withMessage('Tamaño inválido'),

  query('sexo')
    .optional({ values: 'falsy' })
    .isIn(['macho', 'hembra'])
    .withMessage('Sexo inválido'),

  query('search')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('La búsqueda no puede exceder 100 caracteres'),

  query('page')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('La página debe ser un entero positivo'),

  query('limit')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100'),
];

const idParamValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID inválido'),
];

module.exports = {
  createMascotaValidator,
  updateMascotaValidator,
  listMascotasValidator,
  idParamValidator,
};
