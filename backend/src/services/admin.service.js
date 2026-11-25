const pool = require('../config/db');

async function getReports() {
  const [usersRes, petsRes, solicitudesRes, rescatesRes, citasRes] = await Promise.all([
    pool.query(`SELECT rol, COUNT(*)::int AS total FROM usuarios GROUP BY rol ORDER BY rol`),
    pool.query(`SELECT estado, COUNT(*)::int AS total FROM mascotas GROUP BY estado ORDER BY estado`),
    pool.query(`SELECT estado, COUNT(*)::int AS total FROM solicitudes_adopcion GROUP BY estado ORDER BY estado`),
    pool.query(`SELECT COUNT(*)::int AS total FROM rescates`),
    pool.query(`SELECT estado, COUNT(*)::int AS total FROM citas_adopcion GROUP BY estado ORDER BY estado`),
  ]);

  const totalUsuarios = usersRes.rows.reduce((sum, r) => sum + r.total, 0);
  const totalMascotas = petsRes.rows.reduce((sum, r) => sum + r.total, 0);
  const totalSolicitudes = solicitudesRes.rows.reduce((sum, r) => sum + r.total, 0);
  const totalCitas = citasRes.rows.reduce((sum, r) => sum + r.total, 0);

  return {
    usuarios: {
      total: totalUsuarios,
      por_rol: usersRes.rows.reduce((acc, row) => {
        acc[row.rol] = row.total;
        return acc;
      }, {}),
    },
    mascotas: {
      total: totalMascotas,
      por_estado: petsRes.rows.reduce((acc, row) => {
        acc[row.estado] = row.total;
        return acc;
      }, {}),
    },
    solicitudes: {
      total: totalSolicitudes,
      por_estado: solicitudesRes.rows.reduce((acc, row) => {
        acc[row.estado] = row.total;
        return acc;
      }, {}),
    },
    rescates: {
      total: rescatesRes.rows[0].total,
    },
    citas: {
      total: totalCitas,
      por_estado: citasRes.rows.reduce((acc, row) => {
        acc[row.estado] = row.total;
        return acc;
      }, {}),
    },
  };
}

async function listUsers(filters = {}) {
  const { rol, estado, search, page = 1, limit = 50 } = filters;
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (rol) {
    conditions.push(`u.rol = $${paramIndex++}`);
    params.push(rol);
  }
  if (estado) {
    conditions.push(`u.estado = $${paramIndex++}`);
    params.push(estado);
  }
  if (search) {
    conditions.push(`(u.nombre ILIKE $${paramIndex} OR u.correo ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const safeLimit = parseInt(limit, 10) || 50;
  const safePage = parseInt(page, 10) || 1;
  const offset = (safePage - 1) * safeLimit;

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM usuarios u ${whereClause}`,
    params
  );
  const total = countResult.rows[0].total;

  const dataResult = await pool.query(
    `SELECT u.id_usuario, u.nombre, u.correo, u.telefono, u.direccion, u.rol, u.estado, u.created_at
     FROM usuarios u
     ${whereClause}
     ORDER BY u.created_at DESC, u.id_usuario ASC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, safeLimit, offset]
  );

  return {
    usuarios: dataResult.rows.map((u) => ({ ...u, email: u.correo })),
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

async function updateUserStatus(id_usuario, nuevoEstado, currentAdminId) {
  const validEstados = ['activo', 'inactivo', 'suspendido'];
  if (!validEstados.includes(nuevoEstado)) {
    throw Object.assign(new Error('Estado de usuario inválido'), { statusCode: 400 });
  }

  if (currentAdminId && Number(id_usuario) === Number(currentAdminId) && nuevoEstado !== 'activo') {
    throw Object.assign(
      new Error('No puedes desactivar ni suspender tu propia cuenta de administrador'),
      { statusCode: 400 }
    );
  }

  const result = await pool.query(
    `UPDATE usuarios
     SET estado = $1,
         intentos_fallidos = CASE WHEN $1 = 'activo' THEN 0 ELSE intentos_fallidos END,
         bloqueado_hasta = CASE WHEN $1 = 'activo' THEN NULL ELSE bloqueado_hasta END
     WHERE id_usuario = $2
     RETURNING id_usuario, nombre, correo, rol, estado`,
    [nuevoEstado, id_usuario]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  }

  return { ...result.rows[0], email: result.rows[0].correo };
}

module.exports = { getReports, listUsers, updateUserStatus };
