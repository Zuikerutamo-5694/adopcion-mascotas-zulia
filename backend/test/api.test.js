const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/index');
const pool = require('../src/config/db');

let server;
let baseUrl;
let tokens = {};

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}/api`;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await pool.end();
});

test('1. Healthcheck confirma conexión activa a Supabase PostgreSQL', async () => {
  const { status, json } = await request('/health');
  assert.equal(status, 200);
  assert.equal(json.success, true);
  assert.equal(json.data.database, 'connected');
});

test('2. Seguridad: bloquea auto-registro público como administrador', async () => {
  const { status, json } = await request('/auth/register', {
    method: 'POST',
    body: {
      nombre: 'Intruso Admin',
      correo: 'intruso@test.com',
      password: 'Password123!',
      rol: 'administrador',
    },
  });
  assert.equal(status, 400);
  assert.equal(json.success, false);
});

test('3. Login real funciona para los 4 roles semilla en Supabase', async () => {
  const accounts = [
    ['administrador', 'admin@adopcionzulia.org'],
    ['veterinario', 'vet.carlos@veterinariazulia.com'],
    ['rescatista', 'maria.rescatista@fundacionhuellas.org'],
    ['adoptante', 'juan.adoptante@gmail.com'],
  ];

  for (const [rol, correo] of accounts) {
    const { status, json } = await request('/auth/login', {
      method: 'POST',
      body: { correo, password: 'Password123!' },
    });
    assert.equal(status, 200, `Login falló para ${rol}: ${json.message}`);
    assert.equal(json.data.user.rol, rol);
    tokens[rol] = json.data.token;
  }
});

test('4. Catálogo de mascotas soporta todos los estados (incluyendo en_tratamiento y adoptada) y paginación', async () => {
  const all = await request('/mascotas?limit=5&page=1');
  assert.equal(all.status, 200);
  assert.ok(all.json.data.mascotas.length > 0);
  assert.ok(all.json.data.pagination.total >= 8);

  const trat = await request('/mascotas?estado=en_tratamiento');
  assert.equal(trat.status, 200);
  assert.ok(trat.json.data.mascotas.some((m) => m.nombre === 'Rocky'));
});

test('5. Bandeja clínica de expedientes devuelve pacientes y signos vitales', async () => {
  const { status, json } = await request('/expedientes', {
    token: tokens.veterinario,
  });
  assert.equal(status, 200);
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.length >= 8);
  const luna = json.data.find((p) => p.nombre === 'Luna');
  assert.ok(luna?.id_expediente, 'Luna debe tener expediente clínico');
});

test('6. Control IDOR: adoptante no puede leer solicitud perteneciente a otro adoptante', async () => {
  const adminList = await request('/solicitudes', { token: tokens.administrador });
  assert.equal(adminList.status, 200);
  const luisaSolicitud = adminList.json.data.solicitudes.find(
    (s) => s.adoptante_correo === 'luisa.reyes@gmail.com'
  );
  assert.ok(luisaSolicitud, 'Debe existir solicitud de Luisa en semillas');

  const forbidden = await request(`/solicitudes/${luisaSolicitud.id_solicitud}`, {
    token: tokens.adoptante, // Juan tratando de leer solicitud de Luisa
  });
  assert.equal(forbidden.status, 403);
});

test('7. Panel de administración devuelve métricas reales y bloquea auto-desactivación', async () => {
  const rep = await request('/admin/reportes', { token: tokens.administrador });
  assert.equal(rep.status, 200);
  assert.ok(rep.json.data.usuarios.total >= 7);
  assert.ok(rep.json.data.mascotas.total >= 8);

  const me = await request('/auth/me', { token: tokens.administrador });
  const selfDeactivate = await request(
    `/admin/usuarios/${me.json.data.id_usuario}/estado`,
    {
      method: 'PATCH',
      token: tokens.administrador,
      body: { estado: 'inactivo' },
    }
  );
  assert.equal(selfDeactivate.status, 400);
});
