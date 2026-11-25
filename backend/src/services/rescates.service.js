const pool = require('../config/db');

function formatRescate(row) {
  if (!row) return row;
  return {
    ...row,
    descripcion: row.notas || '',
    condicion: row.condicion_inicial || '',
    fecha: row.fecha_rescate,
  };
}

async function create(data, id_rescatista) {
  const { ubicacion, fecha_rescate, condicion_inicial, notas, observaciones } = data;

  const result = await pool.query(
    `INSERT INTO rescates (id_rescatista, ubicacion, fecha_rescate, condicion_inicial, notas, observaciones)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      id_rescatista,
      ubicacion,
      fecha_rescate || new Date().toISOString().split('T')[0],
      condicion_inicial || null,
      notas || null,
      observaciones || null,
    ]
  );

  return formatRescate(result.rows[0]);
}

async function list(user, filters = {}) {
  const { page = 1, limit = 50 } = filters;
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (user.rol === 'rescatista') {
    conditions.push(`r.id_rescatista = $${paramIndex++}`);
    params.push(user.id_usuario);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const safeLimit = parseInt(limit, 10) || 50;
  const safePage = parseInt(page, 10) || 1;
  const offset = (safePage - 1) * safeLimit;

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM rescates r ${whereClause}`,
    params
  );
  const total = countResult.rows[0].total;

  const dataResult = await pool.query(
    `SELECT r.*,
            u.nombre AS rescatista_nombre,
            COALESCE(
              (SELECT json_agg(json_build_object('id_mascota', m.id_mascota, 'nombre', m.nombre, 'especie', m.especie, 'estado', m.estado))
               FROM mascotas m WHERE m.id_rescate = r.id_rescate),
              '[]'::json
            ) AS mascotas_vinculadas
     FROM rescates r
     JOIN usuarios u ON u.id_usuario = r.id_rescatista
     ${whereClause}
     ORDER BY r.fecha_rescate DESC, r.id_rescate DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, safeLimit, offset]
  );

  return {
    rescates: dataResult.rows.map(formatRescate),
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

async function getById(id_rescate, user) {
  const result = await pool.query(
    `SELECT r.*, u.nombre AS rescatista_nombre
     FROM rescates r
     JOIN usuarios u ON u.id_usuario = r.id_rescatista
     WHERE r.id_rescate = $1`,
    [id_rescate]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Rescate no encontrado'), { statusCode: 404 });
  }

  const row = result.rows[0];
  if (user && user.rol === 'rescatista' && Number(row.id_rescatista) !== Number(user.id_usuario)) {
    throw Object.assign(new Error('No tienes permiso para ver este rescate'), { statusCode: 403 });
  }

  const petsRes = await pool.query(
    `SELECT id_mascota, nombre, especie, estado FROM mascotas WHERE id_rescate = $1 ORDER BY id_mascota ASC`,
    [id_rescate]
  );

  return { ...formatRescate(row), mascotas_vinculadas: petsRes.rows };
}

async function update(id_rescate, data, user) {
  const check = await pool.query(`SELECT id_rescatista FROM rescates WHERE id_rescate = $1`, [id_rescate]);
  if (check.rows.length === 0) {
    throw Object.assign(new Error('Rescate no encontrado'), { statusCode: 404 });
  }
  if (user.rol !== 'administrador' && Number(check.rows[0].id_rescatista) !== Number(user.id_usuario)) {
    throw Object.assign(new Error('Solo el rescatista titular o un administrador puede editar este rescate'), { statusCode: 403 });
  }

  const result = await pool.query(
    `UPDATE rescates
     SET ubicacion = COALESCE($1, ubicacion),
         fecha_rescate = COALESCE($2, fecha_rescate),
         condicion_inicial = $3,
         notas = $4,
         observaciones = $5
     WHERE id_rescate = $6
     RETURNING *`,
    [
      data.ubicacion,
      data.fecha_rescate || null,
      data.condicion_inicial,
      data.notas,
      data.observaciones,
      id_rescate,
    ]
  );

  return formatRescate(result.rows[0]);
}

async function remove(id_rescate, user) {
  const check = await pool.query(`SELECT id_rescatista FROM rescates WHERE id_rescate = $1`, [id_rescate]);
  if (check.rows.length === 0) {
    throw Object.assign(new Error('Rescate no encontrado'), { statusCode: 404 });
  }
  if (user.rol !== 'administrador' && Number(check.rows[0].id_rescatista) !== Number(user.id_usuario)) {
    throw Object.assign(new Error('Solo el rescatista titular o un administrador puede eliminar este rescate'), { statusCode: 403 });
  }

  await pool.query(`DELETE FROM rescates WHERE id_rescate = $1`, [id_rescate]);
  return { id_rescate: Number(id_rescate) };
}

module.exports = { create, list, getById, update, remove };
