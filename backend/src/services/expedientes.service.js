const pool = require('../config/db');

function normalizeVacunas(vacunas, veterinarioNombre = '') {
  if (!Array.isArray(vacunas)) return [];
  const today = new Date().toISOString().split('T')[0];
  return vacunas
    .map((v) => {
      if (typeof v === 'string') {
        const trimmed = v.trim();
        return trimmed
          ? { nombre: trimmed, fecha: today, proxima: '', veterinario: veterinarioNombre }
          : null;
      }
      if (v && typeof v === 'object' && v.nombre) {
        return {
          nombre: String(v.nombre).trim(),
          fecha: v.fecha ? String(v.fecha).trim() : today,
          proxima: v.proxima ? String(v.proxima).trim() : '',
          veterinario: v.veterinario ? String(v.veterinario).trim() : veterinarioNombre,
        };
      }
      return null;
    })
    .filter(Boolean);
}

async function listOverview(filters = {}) {
  const { search } = filters;
  const params = [];
  let where = '';

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    where = `WHERE m.nombre ILIKE $1 OR m.raza ILIKE $1`;
  }

  const res = await pool.query(
    `SELECT m.id_mascota, m.nombre, m.especie, m.raza, m.edad_aprox, m.peso AS mascota_peso,
            m.estado, m.condicion_salud,
            (SELECT f.url_imagen FROM fotos_mascota f
             WHERE f.id_mascota = m.id_mascota
             ORDER BY f.es_principal DESC, f.id_foto ASC LIMIT 1) AS foto_principal,
            e.id_expediente, e.diagnostico, e.tratamientos, e.peso, e.temperatura,
            e.vacunas, e.observaciones, e.fecha_actualizacion,
            u.nombre AS veterinario_nombre
     FROM mascotas m
     LEFT JOIN LATERAL (
       SELECT * FROM expedientes_medicos em
       WHERE em.id_mascota = m.id_mascota
       ORDER BY em.fecha_actualizacion DESC, em.id_expediente DESC
       LIMIT 1
     ) e ON TRUE
     LEFT JOIN usuarios u ON u.id_usuario = e.id_veterinario
     ${where}
     ORDER BY e.fecha_actualizacion DESC NULLS LAST, m.created_at DESC`,
    params
  );

  return res.rows;
}

async function create(data, id_veterinario) {
  const { id_mascota, peso, temperatura, vacunas, diagnostico, tratamientos, observaciones } = data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const [petCheck, vetCheck] = await Promise.all([
      client.query(`SELECT id_mascota FROM mascotas WHERE id_mascota = $1 FOR UPDATE`, [id_mascota]),
      client.query(`SELECT nombre FROM usuarios WHERE id_usuario = $1`, [id_veterinario]),
    ]);

    if (petCheck.rows.length === 0) {
      throw Object.assign(new Error('Mascota no encontrada'), { statusCode: 404 });
    }

    const vetNombre = vetCheck.rows[0]?.nombre || '';
    const structuredVacunas = normalizeVacunas(vacunas, vetNombre);
    const parsedPeso = peso !== undefined && peso !== '' && peso !== null ? parseFloat(peso) : null;
    const parsedTemp =
      temperatura !== undefined && temperatura !== '' && temperatura !== null
        ? parseFloat(temperatura)
        : null;

    const result = await client.query(
      `INSERT INTO expedientes_medicos
         (id_mascota, id_veterinario, peso, temperatura, vacunas, diagnostico, tratamientos, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id_mascota,
        id_veterinario,
        parsedPeso,
        parsedTemp,
        JSON.stringify(structuredVacunas),
        diagnostico || null,
        tratamientos || null,
        observaciones || null,
      ]
    );

    // Sincronizar peso y vacunas con la ficha de la mascota
    const syncFields = [];
    const syncParams = [];
    let idx = 1;
    if (parsedPeso !== null) {
      syncFields.push(`peso = $${idx++}`);
      syncParams.push(parsedPeso);
    }
    if (structuredVacunas.length > 0) {
      syncFields.push(`vacunas = $${idx++}`);
      syncParams.push(JSON.stringify(structuredVacunas));
    }
    if (syncFields.length > 0) {
      syncParams.push(id_mascota);
      await client.query(
        `UPDATE mascotas SET ${syncFields.join(', ')} WHERE id_mascota = $${idx}`,
        syncParams
      );
    }

    await client.query('COMMIT');
    return { ...result.rows[0], veterinario_nombre: vetNombre };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getByMascota(id_mascota) {
  const result = await pool.query(
    `SELECT e.*, u.nombre AS veterinario_nombre, m.nombre AS mascota_nombre
     FROM expedientes_medicos e
     JOIN usuarios u ON u.id_usuario = e.id_veterinario
     JOIN mascotas m ON m.id_mascota = e.id_mascota
     WHERE e.id_mascota = $1
     ORDER BY e.fecha_actualizacion DESC, e.id_expediente DESC`,
    [id_mascota]
  );

  return result.rows;
}

async function getById(id_expediente) {
  const result = await pool.query(
    `SELECT e.*, u.nombre AS veterinario_nombre, m.nombre AS mascota_nombre
     FROM expedientes_medicos e
     JOIN usuarios u ON u.id_usuario = e.id_veterinario
     JOIN mascotas m ON m.id_mascota = e.id_mascota
     WHERE e.id_expediente = $1`,
    [id_expediente]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Expediente médico no encontrado'), { statusCode: 404 });
  }

  return result.rows[0];
}

async function update(id_expediente, data, id_veterinario) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const vetCheck = await client.query(`SELECT nombre FROM usuarios WHERE id_usuario = $1`, [id_veterinario]);
    const vetNombre = vetCheck.rows[0]?.nombre || '';

    const fields = [];
    const params = [];
    let paramIndex = 1;
    let structuredVacunas = null;

    if (data.vacunas !== undefined) {
      structuredVacunas = normalizeVacunas(data.vacunas, vetNombre);
      fields.push(`vacunas = $${paramIndex++}`);
      params.push(JSON.stringify(structuredVacunas));
    }
    if (data.diagnostico !== undefined) {
      fields.push(`diagnostico = $${paramIndex++}`);
      params.push(data.diagnostico);
    }
    if (data.tratamientos !== undefined) {
      fields.push(`tratamientos = $${paramIndex++}`);
      params.push(data.tratamientos);
    }
    if (data.observaciones !== undefined) {
      fields.push(`observaciones = $${paramIndex++}`);
      params.push(data.observaciones);
    }
    if (data.peso !== undefined) {
      fields.push(`peso = $${paramIndex++}`);
      params.push(data.peso === '' || data.peso === null ? null : parseFloat(data.peso));
    }
    if (data.temperatura !== undefined) {
      fields.push(`temperatura = $${paramIndex++}`);
      params.push(data.temperatura === '' || data.temperatura === null ? null : parseFloat(data.temperatura));
    }

    if (fields.length === 0) {
      throw Object.assign(new Error('No se proporcionaron campos para actualizar'), { statusCode: 400 });
    }

    fields.push(`fecha_actualizacion = NOW()`);
    fields.push(`id_veterinario = $${paramIndex++}`);
    params.push(id_veterinario);
    params.push(id_expediente);

    const result = await client.query(
      `UPDATE expedientes_medicos
       SET ${fields.join(', ')}
       WHERE id_expediente = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw Object.assign(new Error('Expediente médico no encontrado'), { statusCode: 404 });
    }

    const updated = result.rows[0];

    const syncFields = [];
    const syncParams = [];
    let idx = 1;
    if (updated.peso !== null && updated.peso !== undefined) {
      syncFields.push(`peso = $${idx++}`);
      syncParams.push(updated.peso);
    }
    if (structuredVacunas !== null) {
      syncFields.push(`vacunas = $${idx++}`);
      syncParams.push(JSON.stringify(structuredVacunas));
    }
    if (syncFields.length > 0) {
      syncParams.push(updated.id_mascota);
      await client.query(
        `UPDATE mascotas SET ${syncFields.join(', ')} WHERE id_mascota = $${idx}`,
        syncParams
      );
    }

    await client.query('COMMIT');
    return { ...updated, veterinario_nombre: vetNombre };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { listOverview, create, getByMascota, getById, update };
