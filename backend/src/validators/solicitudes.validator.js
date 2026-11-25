const { body, param } = require('express-validator');

function parseFlexibleDateTime(rawFechaHora, rawFecha, rawHora) {
  if (rawFechaHora && !isNaN(Date.parse(rawFechaHora))) {
    return new Date(rawFechaHora).toISOString();
  }

  if (rawFecha && rawHora) {
    let dateStr = String(rawFecha).trim();
    let timeStr = String(rawHora).trim();

    // Soportar DD/MM/AAAA -> AAAA-MM-DD
    const dmyMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(dateStr);
    if (dmyMatch) {
      const [, dd, mm, yyyy] = dmyMatch;
      dateStr = `${yyyy}-${dd.padStart(2, '0')}-${mm.padStart(2, '0')}`;
    }

    // Soportar HH:MM AM/PM -> HH:MM (24h)
    const ampmMatch = /^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/.exec(timeStr);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const mins = ampmMatch[2];
      const meridiem = (ampmMatch[3] || '').toUpperCase();
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      timeStr = `${String(hours).padStart(2, '0')}:${mins}:00`;
    } else if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
      // ya tiene segundos
    } else {
      timeStr = `${timeStr}:00`;
    }

    const combined = `${dateStr}T${timeStr}`;
    if (!isNaN(Date.parse(combined))) {
      return new Date(combined).toISOString();
    }
  }

  return null;
}

const createSolicitudValidator = [
  body('id_mascota')
    .custom((val, { req }) => {
      const id = val || req.body.mascotaId;
      if (!id || isNaN(parseInt(id, 10))) {
        throw new Error('El id de la mascota es obligatorio');
      }
      req.body.id_mascota = parseInt(id, 10);
      if (!req.body.datos_formulario && (req.body.motivo || req.body.experiencia)) {
        req.body.datos_formulario = {
          motivo: req.body.motivo || '',
          experiencia_mascotas: req.body.experiencia || '',
        };
      }
      return true;
    }),

  body('datos_formulario')
    .optional()
    .isObject().withMessage('datos_formulario debe ser un objeto JSON'),
];

const evaluateSolicitudValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de solicitud inválido'),

  body('estado')
    .notEmpty().withMessage('El estado es obligatorio')
    .isIn(['en_revision', 'aprobada', 'rechazada'])
    .withMessage('El estado de evaluación debe ser en_revision, aprobada o rechazada'),

  body('motivo_decision')
    .custom((val, { req }) => {
      req.body.motivo_decision = (val || req.body.comentarios || req.body.motivo || '').trim() || null;
      return true;
    }),
];

const createCitaValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de solicitud inválido'),

  body('fecha_hora')
    .custom((val, { req }) => {
      const iso = parseFlexibleDateTime(
        val || req.body.fechaHora,
        req.body.fecha,
        req.body.hora
      );
      if (!iso) {
        throw new Error('Ingresa una fecha (AAAA-MM-DD o DD/MM/AAAA) y hora (HH:MM) válidas');
      }
      req.body.fecha_hora = iso;
      return true;
    }),

  body('lugar')
    .trim()
    .notEmpty().withMessage('El lugar es obligatorio')
    .isLength({ max: 300 }).withMessage('El lugar no puede exceder 300 caracteres'),

  body('notas')
    .optional({ nullable: true })
    .trim(),
];

const updateCitaEstadoValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID de solicitud inválido'),
  param('citaId').isInt({ min: 1 }).withMessage('ID de cita inválido'),
  body('estado')
    .notEmpty().withMessage('El estado de la cita es obligatorio')
    .isIn(['programada', 'completada', 'cancelada'])
    .withMessage('Estado de cita inválido'),
];

const idParamValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID inválido'),
];

module.exports = {
  createSolicitudValidator,
  evaluateSolicitudValidator,
  createCitaValidator,
  updateCitaEstadoValidator,
  idParamValidator,
};
