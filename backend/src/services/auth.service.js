const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const jwtConfig = require('../config/jwt');

const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;

const PROFILE_TABLE_MAP = {
  adoptante: 'perfiles_adoptante',
  rescatista: 'perfiles_rescatista',
  veterinario: 'perfiles_veterinario',
  administrador: 'perfiles_administrador',
};

async function buildFullUser(clientOrPool, id_usuario) {
  const userResult = await clientOrPool.query(
    `SELECT id_usuario, nombre, correo, telefono, direccion, rol, estado, created_at
     FROM usuarios WHERE id_usuario = $1`,
    [id_usuario]
  );

  if (userResult.rows.length === 0) {
    throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  }

  const user = userResult.rows[0];
  let profile = null;
  const tableName = PROFILE_TABLE_MAP[user.rol];

  if (tableName) {
    const profileResult = await clientOrPool.query(
      `SELECT * FROM ${tableName} WHERE id_usuario = $1`,
      [id_usuario]
    );
    if (profileResult.rows.length > 0) {
      const { id_usuario: _ignored, ...profileData } = profileResult.rows[0];
      if (profileData.numero_licencia && !profileData.licencia) {
        profileData.licencia = profileData.numero_licencia;
      }
      profile = profileData;
    }
  }

  return {
    ...(profile || {}),
    ...user,
    createdAt: user.created_at,
    perfil: profile,
  };
}

async function register(userData) {
  const {
    nombre, correo, password, telefono, direccion, rol,
    ingresos_aproximados, tipo_vivienda, tiene_jardin, experiencia,
    organizacion, zona_rescate,
    numero_licencia, licencia, clinica_asociada, especialidad,
  } = userData;

  const resolvedLicense = (numero_licencia || licencia || '').trim();
  if (rol === 'veterinario' && !resolvedLicense) {
    throw Object.assign(new Error('El número de licencia es obligatorio para veterinarios'), { statusCode: 400 });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const userResult = await client.query(
      `INSERT INTO usuarios (nombre, correo, password_hash, telefono, direccion, rol)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_usuario`,
      [nombre, correo, password_hash, telefono || null, direccion || null, rol]
    );

    const id_usuario = userResult.rows[0].id_usuario;

    switch (rol) {
      case 'adoptante':
        await client.query(
          `INSERT INTO perfiles_adoptante (id_usuario, ingresos_aproximados, tipo_vivienda, tiene_jardin, experiencia)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            id_usuario,
            ingresos_aproximados !== undefined && ingresos_aproximados !== '' ? ingresos_aproximados : null,
            tipo_vivienda || null,
            Boolean(tiene_jardin),
            experiencia || null,
          ]
        );
        break;

      case 'rescatista':
        await client.query(
          `INSERT INTO perfiles_rescatista (id_usuario, organizacion, zona_rescate, experiencia)
           VALUES ($1, $2, $3, $4)`,
          [id_usuario, organizacion || null, zona_rescate || null, experiencia || null]
        );
        break;

      case 'veterinario':
        await client.query(
          `INSERT INTO perfiles_veterinario (id_usuario, numero_licencia, clinica_asociada, especialidad)
           VALUES ($1, $2, $3, $4)`,
          [id_usuario, resolvedLicense, clinica_asociada || null, especialidad || null]
        );
        break;
    }

    const fullUser = await buildFullUser(client, id_usuario);
    await client.query('COMMIT');

    const token = jwt.sign(
      { id_usuario: fullUser.id_usuario, rol: fullUser.rol },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiration }
    );

    return { user: fullUser, token };
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      const detail = String(err.detail || '');
      if (detail.includes('numero_licencia')) {
        throw Object.assign(new Error('Ese número de licencia veterinaria ya está registrado'), { statusCode: 409 });
      }
      throw Object.assign(new Error('Ya existe una cuenta registrada con ese correo electrónico'), { statusCode: 409 });
    }
    throw err;
  } finally {
    client.release();
  }
}

async function login(correo, password) {
  const result = await pool.query(
    `SELECT id_usuario, nombre, correo, password_hash, rol, estado,
            intentos_fallidos, bloqueado_hasta
     FROM usuarios WHERE correo = $1`,
    [correo]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  const user = result.rows[0];

  if (user.estado !== 'activo') {
    throw Object.assign(
      new Error('Tu cuenta está suspendida o inactiva. Contacta al administrador.'),
      { statusCode: 403 }
    );
  }

  if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
    const remaining = Math.ceil((new Date(user.bloqueado_hasta) - new Date()) / 60000);
    throw Object.assign(
      new Error(`Cuenta bloqueada temporalmente. Intenta de nuevo en ${remaining} minuto(s).`),
      { statusCode: 429 }
    );
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    // Si ya había expirado un bloqueo anterior, reiniciar el conteo en 1
    const baseAttempts =
      user.bloqueado_hasta && new Date(user.bloqueado_hasta) <= new Date()
        ? 0
        : user.intentos_fallidos;
    const newAttempts = baseAttempts + 1;

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      await pool.query(
        `UPDATE usuarios
         SET intentos_fallidos = $1, bloqueado_hasta = NOW() + ($2 || ' minutes')::INTERVAL
         WHERE id_usuario = $3`,
        [newAttempts, String(LOCKOUT_MINUTES), user.id_usuario]
      );
      throw Object.assign(
        new Error(`Cuenta bloqueada por ${LOCKOUT_MINUTES} minutos debido a 3 intentos fallidos consecutivos.`),
        { statusCode: 429 }
      );
    }

    await pool.query(
      `UPDATE usuarios SET intentos_fallidos = $1, bloqueado_hasta = NULL WHERE id_usuario = $2`,
      [newAttempts, user.id_usuario]
    );
    throw Object.assign(
      new Error(`Credenciales inválidas. Intentos restantes: ${MAX_FAILED_ATTEMPTS - newAttempts}`),
      { statusCode: 401 }
    );
  }

  await pool.query(
    `UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id_usuario = $1`,
    [user.id_usuario]
  );

  const fullUser = await buildFullUser(pool, user.id_usuario);
  const token = jwt.sign(
    { id_usuario: fullUser.id_usuario, rol: fullUser.rol },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiration }
  );

  return { user: fullUser, token };
}

async function getMe(id_usuario) {
  return buildFullUser(pool, id_usuario);
}

async function updateMe(id_usuario, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      `SELECT rol FROM usuarios WHERE id_usuario = $1 FOR UPDATE`,
      [id_usuario]
    );
    if (userRes.rows.length === 0) {
      throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
    }
    const rol = userRes.rows[0].rol;

    const userFields = [];
    const userParams = [];
    let idx = 1;

    for (const key of ['nombre', 'telefono', 'direccion']) {
      if (data[key] !== undefined) {
        userFields.push(`${key} = $${idx++}`);
        userParams.push(data[key] === '' ? null : data[key]);
      }
    }

    if (userFields.length > 0) {
      userParams.push(id_usuario);
      await client.query(
        `UPDATE usuarios SET ${userFields.join(', ')} WHERE id_usuario = $${idx}`,
        userParams
      );
    }

    if (rol === 'adoptante') {
      await client.query(
        `INSERT INTO perfiles_adoptante (id_usuario, ingresos_aproximados, tipo_vivienda, tiene_jardin, experiencia)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id_usuario) DO UPDATE SET
           ingresos_aproximados = COALESCE($2, perfiles_adoptante.ingresos_aproximados),
           tipo_vivienda = COALESCE($3, perfiles_adoptante.tipo_vivienda),
           tiene_jardin = COALESCE($4, perfiles_adoptante.tiene_jardin),
           experiencia = COALESCE($5, perfiles_adoptante.experiencia)`,
        [
          id_usuario,
          data.ingresos_aproximados !== undefined && data.ingresos_aproximados !== ''
            ? parseFloat(data.ingresos_aproximados)
            : null,
          data.tipo_vivienda || null,
          data.tiene_jardin !== undefined ? Boolean(data.tiene_jardin) : null,
          data.experiencia !== undefined ? data.experiencia : null,
        ]
      );
    } else if (rol === 'rescatista') {
      await client.query(
        `INSERT INTO perfiles_rescatista (id_usuario, organizacion, zona_rescate, experiencia)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id_usuario) DO UPDATE SET
           organizacion = COALESCE($2, perfiles_rescatista.organizacion),
           zona_rescate = COALESCE($3, perfiles_rescatista.zona_rescate),
           experiencia = COALESCE($4, perfiles_rescatista.experiencia)`,
        [
          id_usuario,
          data.organizacion !== undefined ? data.organizacion : null,
          data.zona_rescate !== undefined ? data.zona_rescate : null,
          data.experiencia !== undefined ? data.experiencia : null,
        ]
      );
    } else if (rol === 'veterinario') {
      const lic = data.numero_licencia || data.licencia || null;
      await client.query(
        `UPDATE perfiles_veterinario SET
           numero_licencia = COALESCE($2, numero_licencia),
           clinica_asociada = COALESCE($3, clinica_asociada),
           especialidad = COALESCE($4, especialidad)
         WHERE id_usuario = $1`,
        [
          id_usuario,
          lic,
          data.clinica_asociada !== undefined ? data.clinica_asociada : null,
          data.especialidad !== undefined ? data.especialidad : null,
        ]
      );
    }

    const updated = await buildFullUser(client, id_usuario);
    await client.query('COMMIT');
    return updated;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { register, login, getMe, updateMe };
