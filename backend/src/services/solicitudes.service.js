const pool = require('../config/db');

function formatCita(cita) {
  if (!cita) return cita;
  const dt = cita.fecha_hora ? new Date(cita.fecha_hora) : null;
  const fecha = dt && !isNaN(dt.getTime()) ? dt.toLocaleDateString('es-VE') : '';
  const hora =
    dt && !isNaN(dt.getTime())
      ? dt.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
      : '';
  return {
    ...cita,
    fecha,
    hora,
  };
}

function formatSolicitud(row, citas = undefined) {
  if (!row) return row;
  const form = row.datos_formulario || {};
  return {
    ...row,
    motivo: form.motivo || form.motivacion || '',
    experiencia: form.experiencia_mascotas || '',
    comentarios: row.motivo_decision || '',
    fecha: row.fecha_solicitud,
    ...(citas !== undefined ? { citas: citas.map(formatCita) } : {}),
  };
}

function assertSolicitudAccess(row, user) {
  if (!user) {
    throw Object.assign(new Error('Autenticación requerida'), { statusCode: 401 });
  }
  if (user.rol === 'administrador') return;
  if (user.rol === 'adoptante' && Number(row.id_adoptante) === Number(user.id_usuario)) return;
  if (user.rol === 'rescatista' && Number(row.id_publicador) === Number(user.id_usuario)) return;

  throw Object.assign(new Error('No tienes permiso para acceder a esta solicitud'), { statusCode: 403 });
}

async function create(data, id_adoptante) {
  const { id_mascota, datos_formulario } = data;

  const petCheck = await pool.query(
    `SELECT id_mascota, estado FROM mascotas WHERE id_mascota = $1`,
    [id_mascota]
  );

  if (petCheck.rows.length === 0) {
    throw Object.assign(new Error('Mascota no encontrada'), { statusCode: 404 });
  }

  const estadoMascota = petCheck.rows[0].estado;
  if (estadoMascota === 'adoptada') {
    throw Object.assign(new Error('Esta mascota ya fue adoptada'), { statusCode: 400 });
  }
  if (estadoMascota !== 'en_adopcion' && estadoMascota !== 'en_proceso') {
    throw Object.assign(
      new Error('Esta mascota aún se encuentra en rescate o tratamiento médico y no está disponible para solicitud'),
      { statusCode: 400 }
    );
  }

  try {
    const result = await pool.query(
      `INSERT INTO solicitudes_adopcion (id_mascota, id_adoptante, datos_formulario)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id_mascota, id_adoptante, JSON.stringify(datos_formulario || {})]
    );
    return formatSolicitud(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      throw Object.assign(
        new Error('Ya tienes una solicitud activa registrada para esta mascota'),
        { statusCode: 409 }
      );
    }
    throw err;
  }
}

async function list(user, filters = {}) {
  const { estado, page = 1, limit = 30 } = filters;
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (user.rol === 'adoptante') {
    conditions.push(`s.id_adoptante = $${paramIndex++}`);
    params.push(user.id_usuario);
  } else if (user.rol === 'rescatista') {
    conditions.push(`m.id_publicador = $${paramIndex++}`);
    params.push(user.id_usuario);
  }

  if (estado) {
    conditions.push(`s.estado = $${paramIndex++}`);
    params.push(estado);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const safeLimit = parseInt(limit, 10) || 30;
  const safePage = parseInt(page, 10) || 1;
  const offset = (safePage - 1) * safeLimit;

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM solicitudes_adopcion s
     JOIN mascotas m ON m.id_mascota = s.id_mascota
     ${whereClause}`,
    params
  );
  const total = countResult.rows[0].total;

  const dataResult = await pool.query(
    `SELECT s.*,
            m.nombre AS mascota_nombre, m.especie, m.estado AS mascota_estado, m.id_publicador,
            (SELECT f.url_imagen FROM fotos_mascota f
             WHERE f.id_mascota = m.id_mascota
             ORDER BY f.es_principal DESC, f.id_foto ASC LIMIT 1) AS mascota_foto,
            u.nombre AS adoptante_nombre, u.correo AS adoptante_correo, u.telefono AS adoptante_telefono
     FROM solicitudes_adopcion s
     JOIN mascotas m ON m.id_mascota = s.id_mascota
     JOIN usuarios u ON u.id_usuario = s.id_adoptante
     ${whereClause}
     ORDER BY s.fecha_solicitud DESC, s.id_solicitud DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, safeLimit, offset]
  );

  return {
    solicitudes: dataResult.rows.map((r) => formatSolicitud(r)),
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

async function getById(id_solicitud, user) {
  const result = await pool.query(
    `SELECT s.*,
            m.nombre AS mascota_nombre, m.especie, m.raza AS mascota_raza,
            m.estado AS mascota_estado, m.id_publicador,
            (SELECT f.url_imagen FROM fotos_mascota f
             WHERE f.id_mascota = m.id_mascota
             ORDER BY f.es_principal DESC, f.id_foto ASC LIMIT 1) AS mascota_foto,
            u.nombre AS adoptante_nombre, u.correo AS adoptante_correo,
            u.telefono AS adoptante_telefono, u.direccion AS adoptante_direccion,
            pa.ingresos_aproximados AS adoptante_ingresos,
            pa.tipo_vivienda AS adoptante_tipo_vivienda,
            pa.tiene_jardin AS adoptante_tiene_jardin
     FROM solicitudes_adopcion s
     JOIN mascotas m ON m.id_mascota = s.id_mascota
     JOIN usuarios u ON u.id_usuario = s.id_adoptante
     LEFT JOIN perfiles_adoptante pa ON pa.id_usuario = s.id_adoptante
     WHERE s.id_solicitud = $1`,
    [id_solicitud]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Solicitud no encontrada'), { statusCode: 404 });
  }

  const row = result.rows[0];
  assertSolicitudAccess(row, user);

  const citasResult = await pool.query(
    `SELECT * FROM citas_adopcion WHERE id_solicitud = $1 ORDER BY fecha_hora ASC`,
    [id_solicitud]
  );

  return formatSolicitud(row, citasResult.rows);
}

async function evaluate(id_solicitud, data, user) {
  const { estado, motivo_decision } = data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const solCheck = await client.query(
      `SELECT s.id_solicitud, s.id_mascota, s.estado AS estado_actual
       FROM solicitudes_adopcion s
       WHERE s.id_solicitud = $1
       FOR UPDATE`,
      [id_solicitud]
    );

    if (solCheck.rows.length === 0) {
      throw Object.assign(new Error('Solicitud no encontrada'), { statusCode: 404 });
    }

    const solicitud = solCheck.rows[0];

    const petCheck = await client.query(
      `SELECT id_mascota, id_publicador, estado
       FROM mascotas
       WHERE id_mascota = $1
       FOR UPDATE`,
      [solicitud.id_mascota]
    );
    const mascota = petCheck.rows[0];

    if (user.rol !== 'administrador' && Number(mascota.id_publicador) !== Number(user.id_usuario)) {
      throw Object.assign(
        new Error('Solo el rescatista que publicó la mascota o un administrador puede evaluar esta solicitud'),
        { statusCode: 403 }
      );
    }

    if (solicitud.estado_actual === 'aprobada' || solicitud.estado_actual === 'rechazada') {
      throw Object.assign(new Error('Esta solicitud ya tiene una decisión definitiva'), { statusCode: 400 });
    }

    if (estado === 'aprobada' && mascota.estado === 'adoptada') {
      throw Object.assign(new Error('Esta mascota ya fue adoptada en otra solicitud'), { statusCode: 400 });
    }

    const updateResult = await client.query(
      `UPDATE solicitudes_adopcion
       SET estado = $1, motivo_decision = $2
       WHERE id_solicitud = $3
       RETURNING *`,
      [estado, motivo_decision || null, id_solicitud]
    );

    if (estado === 'en_revision' && mascota.estado === 'en_adopcion') {
      await client.query(
        `UPDATE mascotas SET estado = 'en_proceso' WHERE id_mascota = $1`,
        [solicitud.id_mascota]
      );
    } else if (estado === 'aprobada') {
      await client.query(
        `UPDATE mascotas SET estado = 'adoptada' WHERE id_mascota = $1`,
        [solicitud.id_mascota]
      );
      await client.query(
        `UPDATE solicitudes_adopcion
         SET estado = 'rechazada', motivo_decision = 'Otra solicitud fue aprobada para esta mascota'
         WHERE id_mascota = $1 AND id_solicitud != $2 AND estado IN ('pendiente', 'en_revision')`,
        [solicitud.id_mascota, id_solicitud]
      );
    } else if (estado === 'rechazada' && mascota.estado === 'en_proceso') {
      const activeCount = await client.query(
        `SELECT COUNT(*)::int AS cnt FROM solicitudes_adopcion
         WHERE id_mascota = $1 AND estado IN ('pendiente', 'en_revision')`,
        [solicitud.id_mascota]
      );
      if (activeCount.rows[0].cnt === 0) {
        await client.query(
          `UPDATE mascotas SET estado = 'en_adopcion' WHERE id_mascota = $1`,
          [solicitud.id_mascota]
        );
      }
    }

    await client.query('COMMIT');
    return formatSolicitud(updateResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function createCita(id_solicitud, data, user) {
  const { fecha_hora, lugar, notas } = data;

  const solCheck = await pool.query(
    `SELECT s.id_solicitud, s.id_adoptante, s.estado, m.id_publicador
     FROM solicitudes_adopcion s
     JOIN mascotas m ON m.id_mascota = s.id_mascota
     WHERE s.id_solicitud = $1`,
    [id_solicitud]
  );

  if (solCheck.rows.length === 0) {
    throw Object.assign(new Error('Solicitud no encontrada'), { statusCode: 404 });
  }

  const row = solCheck.rows[0];
  assertSolicitudAccess(row, user);

  if (row.estado === 'rechazada') {
    throw Object.assign(new Error('No se pueden agendar citas en una solicitud rechazada'), { statusCode: 400 });
  }

  const result = await pool.query(
    `INSERT INTO citas_adopcion (id_solicitud, fecha_hora, lugar, notas)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id_solicitud, fecha_hora, lugar, notas || null]
  );

  return formatCita(result.rows[0]);
}

async function updateCitaEstado(id_solicitud, id_cita, nuevoEstado, user) {
  const solCheck = await pool.query(
    `SELECT s.id_solicitud, s.id_adoptante, m.id_publicador
     FROM solicitudes_adopcion s
     JOIN mascotas m ON m.id_mascota = s.id_mascota
     WHERE s.id_solicitud = $1`,
    [id_solicitud]
  );

  if (solCheck.rows.length === 0) {
    throw Object.assign(new Error('Solicitud no encontrada'), { statusCode: 404 });
  }
  assertSolicitudAccess(solCheck.rows[0], user);

  const result = await pool.query(
    `UPDATE citas_adopcion
     SET estado = $1
     WHERE id_cita = $2 AND id_solicitud = $3
     RETURNING *`,
    [nuevoEstado, id_cita, id_solicitud]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Cita no encontrada'), { statusCode: 404 });
  }

  return formatCita(result.rows[0]);
}

module.exports = {
  create,
  list,
  getById,
  evaluate,
  createCita,
  updateCitaEstado,
};
