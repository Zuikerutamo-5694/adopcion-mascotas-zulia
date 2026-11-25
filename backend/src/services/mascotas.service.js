const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const uploadDir = process.env.UPLOAD_DIR || 'uploads';

function removeLocalUploadIfExists(urlImagen) {
  if (!urlImagen || !urlImagen.startsWith('/uploads/')) return;
  const filename = path.basename(urlImagen);
  const fullPath = path.resolve(uploadDir, filename);
  fs.unlink(fullPath, () => {});
}

function normalizeVacunas(vacunas) {
  if (!Array.isArray(vacunas)) return [];
  return vacunas
    .map((v) => {
      if (typeof v === 'string') {
        const trimmed = v.trim();
        return trimmed ? { nombre: trimmed, fecha: '', proxima: '', veterinario: '' } : null;
      }
      if (v && typeof v === 'object' && v.nombre) {
        return {
          nombre: String(v.nombre).trim(),
          fecha: v.fecha ? String(v.fecha).trim() : '',
          proxima: v.proxima ? String(v.proxima).trim() : '',
          veterinario: v.veterinario ? String(v.veterinario).trim() : '',
        };
      }
      return null;
    })
    .filter(Boolean);
}

function assertCanManageMascota(mascota, user, { allowVeterinario = true } = {}) {
  if (!user) {
    throw Object.assign(new Error('Autenticación requerida'), { statusCode: 401 });
  }
  if (user.rol === 'administrador') return;
  if (allowVeterinario && user.rol === 'veterinario') return;
  if (user.rol === 'rescatista' && Number(mascota.id_publicador) === Number(user.id_usuario)) {
    return;
  }
  throw Object.assign(
    new Error('Solo el rescatista que publicó esta mascota o un administrador puede realizar esta acción'),
    { statusCode: 403 }
  );
}

async function create(data, id_publicador) {
  const {
    nombre, especie, raza, edad_aprox, peso, color, sexo, tamano,
    estado, ubicacion, fecha_rescate, lugar_rescate, descripcion,
    comportamiento, nivel_ejercicio, compatible_ninos, compatible_perros, compatible_gatos,
    condicion_salud, esterilizado, microchip, numero_microchip,
    alergias, enfermedades_previas, medicamentos_actuales,
    vacunas, alimentacion, documentos_legales, id_rescate, foto_principal,
  } = data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO mascotas (
         nombre, especie, raza, edad_aprox, peso, color, sexo, tamano,
         estado, ubicacion, fecha_rescate, lugar_rescate, descripcion,
         comportamiento, nivel_ejercicio, compatible_ninos, compatible_perros, compatible_gatos,
         condicion_salud, esterilizado, microchip, numero_microchip,
         alergias, enfermedades_previas, medicamentos_actuales,
         vacunas, alimentacion, documentos_legales, id_rescate, id_publicador
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11, $12, $13,
         $14, $15, $16, $17, $18,
         $19, $20, $21, $22,
         $23, $24, $25,
         $26, $27, $28, $29, $30
       )
       RETURNING *`,
      [
        nombre,
        especie,
        raza || null,
        edad_aprox || null,
        peso !== undefined && peso !== '' && peso !== null ? parseFloat(peso) : null,
        color || null,
        sexo,
        tamano,
        estado || 'en_adopcion',
        ubicacion || null,
        fecha_rescate || null,
        lugar_rescate || null,
        descripcion || null,
        comportamiento || null,
        nivel_ejercicio || null,
        compatible_ninos !== undefined ? Boolean(compatible_ninos) : true,
        Boolean(compatible_perros),
        Boolean(compatible_gatos),
        condicion_salud || null,
        Boolean(esterilizado),
        Boolean(microchip),
        microchip && numero_microchip ? numero_microchip : null,
        alergias || null,
        enfermedades_previas || null,
        medicamentos_actuales || null,
        JSON.stringify(normalizeVacunas(vacunas)),
        JSON.stringify(alimentacion && typeof alimentacion === 'object' ? alimentacion : {}),
        JSON.stringify(Array.isArray(documentos_legales) ? documentos_legales : []),
        id_rescate ? parseInt(id_rescate, 10) : null,
        id_publicador,
      ]
    );

    const mascota = result.rows[0];

    if (foto_principal && typeof foto_principal === 'string' && foto_principal.trim()) {
      await client.query(
        `INSERT INTO fotos_mascota (id_mascota, url_imagen, es_principal)
         VALUES ($1, $2, TRUE)`,
        [mascota.id_mascota, foto_principal.trim()]
      );
      mascota.foto_principal = foto_principal.trim();
    }

    await client.query('COMMIT');
    return mascota;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function list(filters = {}) {
  const {
    especie, estado, tamano, sexo, search,
    page = 1, limit = 12,
  } = filters;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (especie) {
    conditions.push(`m.especie = $${paramIndex++}`);
    params.push(especie);
  }
  if (estado) {
    conditions.push(`m.estado = $${paramIndex++}`);
    params.push(estado);
  }
  if (tamano) {
    conditions.push(`m.tamano = $${paramIndex++}`);
    params.push(tamano);
  }
  if (sexo) {
    conditions.push(`m.sexo = $${paramIndex++}`);
    params.push(sexo);
  }
  if (search) {
    conditions.push(
      `(m.nombre ILIKE $${paramIndex} OR m.descripcion ILIKE $${paramIndex} OR m.raza ILIKE $${paramIndex} OR m.ubicacion ILIKE $${paramIndex})`
    );
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const safeLimit = parseInt(limit, 10) || 12;
  const safePage = parseInt(page, 10) || 1;
  const offset = (safePage - 1) * safeLimit;

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM mascotas m ${whereClause}`,
    params
  );
  const total = countResult.rows[0].total;

  const dataResult = await pool.query(
    `SELECT m.*,
            u.nombre AS publicador_nombre,
            COALESCE(
              (SELECT f.url_imagen FROM fotos_mascota f
               WHERE f.id_mascota = m.id_mascota
               ORDER BY f.es_principal DESC, f.id_foto ASC
               LIMIT 1),
              NULL
            ) AS foto_principal
     FROM mascotas m
     JOIN usuarios u ON u.id_usuario = m.id_publicador
     ${whereClause}
     ORDER BY m.created_at DESC, m.id_mascota DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, safeLimit, offset]
  );

  return {
    mascotas: dataResult.rows,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

async function getById(id_mascota) {
  const mascotaResult = await pool.query(
    `SELECT m.*,
            u.nombre AS publicador_nombre,
            u.telefono AS publicador_telefono,
            r.ubicacion AS rescate_ubicacion,
            r.fecha_rescate AS rescate_fecha,
            r.notas AS rescate_notas
     FROM mascotas m
     JOIN usuarios u ON u.id_usuario = m.id_publicador
     LEFT JOIN rescates r ON r.id_rescate = m.id_rescate
     WHERE m.id_mascota = $1`,
    [id_mascota]
  );

  if (mascotaResult.rows.length === 0) {
    throw Object.assign(new Error('Mascota no encontrada'), { statusCode: 404 });
  }

  const [fotosResult, expResult] = await Promise.all([
    pool.query(
      `SELECT id_foto, url_imagen, es_principal
       FROM fotos_mascota
       WHERE id_mascota = $1
       ORDER BY es_principal DESC, id_foto ASC`,
      [id_mascota]
    ),
    pool.query(
      `SELECT e.*, v.nombre AS veterinario_nombre
       FROM expedientes_medicos e
       JOIN usuarios v ON v.id_usuario = e.id_veterinario
       WHERE e.id_mascota = $1
       ORDER BY e.fecha_actualizacion DESC`,
      [id_mascota]
    ),
  ]);

  const row = mascotaResult.rows[0];
  const fotos = fotosResult.rows;

  return {
    ...row,
    foto_principal: fotos[0]?.url_imagen || null,
    fotos,
    expedientes: expResult.rows,
  };
}

async function update(id_mascota, data, user) {
  const existingRes = await pool.query(
    `SELECT id_mascota, id_publicador FROM mascotas WHERE id_mascota = $1`,
    [id_mascota]
  );
  if (existingRes.rows.length === 0) {
    throw Object.assign(new Error('Mascota no encontrada'), { statusCode: 404 });
  }
  assertCanManageMascota(existingRes.rows[0], user, { allowVeterinario: true });

  const scalarFields = [
    'nombre', 'especie', 'raza', 'edad_aprox', 'color', 'sexo',
    'tamano', 'estado', 'ubicacion', 'fecha_rescate', 'lugar_rescate',
    'descripcion', 'comportamiento', 'nivel_ejercicio',
    'condicion_salud', 'numero_microchip', 'alergias',
    'enfermedades_previas', 'medicamentos_actuales',
  ];

  const boolFields = [
    'compatible_ninos', 'compatible_perros', 'compatible_gatos',
    'esterilizado', 'microchip',
  ];

  const fields = [];
  const params = [];
  let paramIndex = 1;

  for (const field of scalarFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = $${paramIndex++}`);
      params.push(data[field] === '' ? null : data[field]);
    }
  }

  for (const field of boolFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = $${paramIndex++}`);
      params.push(Boolean(data[field]));
    }
  }

  if (data.peso !== undefined) {
    fields.push(`peso = $${paramIndex++}`);
    params.push(data.peso === '' || data.peso === null ? null : parseFloat(data.peso));
  }

  if (data.id_rescate !== undefined) {
    fields.push(`id_rescate = $${paramIndex++}`);
    params.push(data.id_rescate ? parseInt(data.id_rescate, 10) : null);
  }

  if (data.vacunas !== undefined) {
    fields.push(`vacunas = $${paramIndex++}`);
    params.push(JSON.stringify(normalizeVacunas(data.vacunas)));
  }

  if (data.alimentacion !== undefined) {
    fields.push(`alimentacion = $${paramIndex++}`);
    params.push(JSON.stringify(data.alimentacion && typeof data.alimentacion === 'object' ? data.alimentacion : {}));
  }

  if (data.documentos_legales !== undefined) {
    fields.push(`documentos_legales = $${paramIndex++}`);
    params.push(JSON.stringify(Array.isArray(data.documentos_legales) ? data.documentos_legales : []));
  }

  if (fields.length === 0) {
    throw Object.assign(new Error('No se proporcionaron campos para actualizar'), { statusCode: 400 });
  }

  params.push(id_mascota);

  await pool.query(
    `UPDATE mascotas SET ${fields.join(', ')} WHERE id_mascota = $${paramIndex}`,
    params
  );

  return getById(id_mascota);
}

async function remove(id_mascota, user) {
  const existingRes = await pool.query(
    `SELECT id_mascota, id_publicador FROM mascotas WHERE id_mascota = $1`,
    [id_mascota]
  );
  if (existingRes.rows.length === 0) {
    throw Object.assign(new Error('Mascota no encontrada'), { statusCode: 404 });
  }
  assertCanManageMascota(existingRes.rows[0], user, { allowVeterinario: false });

  const fotosRes = await pool.query(
    `SELECT url_imagen FROM fotos_mascota WHERE id_mascota = $1`,
    [id_mascota]
  );

  await pool.query(`DELETE FROM mascotas WHERE id_mascota = $1`, [id_mascota]);

  for (const row of fotosRes.rows) {
    removeLocalUploadIfExists(row.url_imagen);
  }

  return { id_mascota: Number(id_mascota) };
}

async function uploadPhotos(id_mascota, files, es_principal_index, user, externalUrl) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const petCheck = await client.query(
      `SELECT id_mascota, id_publicador FROM mascotas WHERE id_mascota = $1 FOR UPDATE`,
      [id_mascota]
    );
    if (petCheck.rows.length === 0) {
      throw Object.assign(new Error('Mascota no encontrada'), { statusCode: 404 });
    }
    assertCanManageMascota(petCheck.rows[0], user, { allowVeterinario: true });

    const existingPrincipal = await client.query(
      `SELECT id_foto FROM fotos_mascota WHERE id_mascota = $1 AND es_principal = TRUE LIMIT 1`,
      [id_mascota]
    );
    let hasPrincipal = existingPrincipal.rows.length > 0;

    const urlsToInsert = files.map((f) => {
      if (f.buffer) {
        const mime = f.mimetype || 'image/jpeg';
        return `data:${mime};base64,${f.buffer.toString('base64')}`;
      }
      return `/uploads/${f.filename}`;
    });
    if (externalUrl && typeof externalUrl === 'string' && externalUrl.trim()) {
      urlsToInsert.push(externalUrl.trim());
    }

    const photos = [];
    const explicitIndex =
      es_principal_index !== undefined && es_principal_index !== ''
        ? parseInt(es_principal_index, 10)
        : null;

    for (let i = 0; i < urlsToInsert.length; i++) {
      const isPrincipal = explicitIndex !== null ? i === explicitIndex : (!hasPrincipal && i === 0);

      if (isPrincipal) {
        await client.query(
          `UPDATE fotos_mascota SET es_principal = FALSE WHERE id_mascota = $1 AND es_principal = TRUE`,
          [id_mascota]
        );
        hasPrincipal = true;
      }

      const result = await client.query(
        `INSERT INTO fotos_mascota (id_mascota, url_imagen, es_principal)
         VALUES ($1, $2, $3) RETURNING *`,
        [id_mascota, urlsToInsert[i], isPrincipal]
      );
      photos.push(result.rows[0]);
    }

    await client.query('COMMIT');
    return photos;
  } catch (err) {
    await client.query('ROLLBACK');
    for (const f of files || []) {
      if (f.path) {
        fs.unlink(f.path, () => {});
      }
    }
    throw err;
  } finally {
    client.release();
  }
}

async function setPrincipalPhoto(id_mascota, id_foto, user) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const petCheck = await client.query(
      `SELECT id_mascota, id_publicador FROM mascotas WHERE id_mascota = $1 FOR UPDATE`,
      [id_mascota]
    );
    if (petCheck.rows.length === 0) {
      throw Object.assign(new Error('Mascota no encontrada'), { statusCode: 404 });
    }
    assertCanManageMascota(petCheck.rows[0], user, { allowVeterinario: true });

    await client.query(
      `UPDATE fotos_mascota SET es_principal = FALSE WHERE id_mascota = $1`,
      [id_mascota]
    );

    const res = await client.query(
      `UPDATE fotos_mascota SET es_principal = TRUE
       WHERE id_mascota = $1 AND id_foto = $2
       RETURNING *`,
      [id_mascota, id_foto]
    );

    if (res.rows.length === 0) {
      throw Object.assign(new Error('Foto no encontrada'), { statusCode: 404 });
    }

    await client.query('COMMIT');
    return res.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deletePhoto(id_mascota, id_foto, user) {
  const petCheck = await pool.query(
    `SELECT id_mascota, id_publicador FROM mascotas WHERE id_mascota = $1`,
    [id_mascota]
  );
  if (petCheck.rows.length === 0) {
    throw Object.assign(new Error('Mascota no encontrada'), { statusCode: 404 });
  }
  assertCanManageMascota(petCheck.rows[0], user, { allowVeterinario: true });

  const deleted = await pool.query(
    `DELETE FROM fotos_mascota WHERE id_mascota = $1 AND id_foto = $2 RETURNING *`,
    [id_mascota, id_foto]
  );

  if (deleted.rows.length === 0) {
    throw Object.assign(new Error('Foto no encontrada'), { statusCode: 404 });
  }

  const deletedPhoto = deleted.rows[0];
  removeLocalUploadIfExists(deletedPhoto.url_imagen);

  if (deletedPhoto.es_principal) {
    await pool.query(
      `UPDATE fotos_mascota
       SET es_principal = TRUE
       WHERE id_foto = (
         SELECT id_foto FROM fotos_mascota WHERE id_mascota = $1 ORDER BY id_foto ASC LIMIT 1
       )`,
      [id_mascota]
    );
  }

  return deletedPhoto;
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  uploadPhotos,
  setPrincipalPhoto,
  deletePhoto,
};
