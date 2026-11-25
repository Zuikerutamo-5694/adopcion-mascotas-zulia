# Red Comunitaria de Adopción y Rescate Animal · Estado Zulia

Plataforma web colaborativa orientada a conectar **fundaciones, rescatistas independientes, médicos veterinarios y familias adoptantes** en Maracaibo, San Francisco y municipios vecinos del Estado Zulia. Centraliza la trazabilidad desde el operativo de rescate y la apertura de historia clínica hasta la postulación socioeconómica y el agendamiento de entrevistas presenciales.

---

## Tabla de Contenidos

1. [Roles y Módulos Funcionales](#1-roles-y-módulos-funcionales)
2. [Stack Tecnológico y Arquitectura](#2-stack-tecnológico-y-arquitectura)
3. [Estructura del Repositorio](#3-estructura-del-repositorio)
4. [Base de Datos en Supabase (PostgreSQL 17)](#4-base-de-datos-en-supabase-postgresql-17)
5. [Endpoints Principales de la API REST](#5-endpoints-principales-de-la-api-rest)
6. [Ejecución en Desarrollo Local](#6-ejecución-en-desarrollo-local)
7. [Despliegue Unificado en Vercel](#7-despliegue-unificado-en-vercel)

---

## 1. Roles y Módulos Funcionales

| Rol | Capacidades en la Plataforma |
| :--- | :--- |
| **Adoptante** | Exploración del catálogo con filtros combinados (especie, estado y texto), consulta de fichas técnicas e historias vacunales, envío de solicitudes socioeconómicas de adopción y seguimiento de citas presenciales. |
| **Rescatista** | Bitácora cronológica de operativos de rescate por municipio/sector, publicación y edición de fichas de animales con carga fotográfica, evaluación de postulaciones entrantes (revisión, aprobación o rechazo) y gestión de citas. |
| **Veterinario** | Bandeja clínica de pacientes, apertura y actualización de historias médicas (diagnóstico, peso, temperatura, tratamientos y esquema de vacunación) sincronizadas con la ficha pública y exportación de expedientes en PDF. |
| **Administrador** | Registro operativo en tiempo real con métricas consolidadas de la base de datos, directorio de cuentas registradas y moderación de estados de acceso (`activo`, `inactivo`, `suspendido`). |

---

## 2. Stack Tecnológico y Arquitectura

* **Frontend Web (`frontend/`)**:
  * **Expo SDK 58** compilado a Single-Page Application (`expo export --platform web`) con **React 19.3**, **React DOM 19.3** y **React Native Web 0.21**.
  * **Expo Router** para enrutamiento declarativo basado en archivos y protección por roles (`ProtectedRoute`).
  * **Sistema de Diseño Editorial Propio** (`DESIGN.md`, `ThemeContext`, `ui.js`): tipografías `Newsreader`, `Plus Jakarta Sans` e `IBM Plex Mono`, soporte persistente de modo claro y oscuro con contraste verificado bajo estándar WCAG AA.
  * **Axios** con interceptores JWT y resolución automática del origen (`/api` en producción sobre Vercel; `http://localhost:4000/api` en entorno local).
* **Backend REST API (`backend/` y `api/`)**:
  * **Node.js (>= 20 / 22 LTS) + Express 4.21**, adaptable tanto a servidor dedicado local (`puerto 4000`) como a **Vercel Serverless Functions** (`api/index.js`).
  * Seguridad mediante `helmet`, `cors`, `express-validator`, hash de contraseñas con `bcryptjs`, control de intentos fallidos y sesiones firmadas con `jsonwebtoken` verificadas contra estado activo en base de datos.
  * Carga de imágenes mediante `multer` (disco local en desarrollo y `memoryStorage` persistido en PostgreSQL en entornos serverless).
* **Base de Datos (`Supabase PostgreSQL 17`)**:
  * Conexión mediante pool `pg` con TLS/SSL sobre el Session Pooler IPv4 de Supabase (`us-east-1`).
  * `ROW LEVEL SECURITY` habilitado en todas las tablas con acceso exclusivo desde el backend autenticado.

```text
[ Navegador Web (Escritorio / Móvil) ]
                  │
                  ▼
     ┌──────────────────────────┐
     │   Vercel Edge Network    │
     └─────┬──────────────┬─────┘
           │ /            │ /api/*
           ▼              ▼
┌───────────────────┐  ┌──────────────────────────┐
│   Expo Web SPA    │  │  Vercel Node.js Function │
│  (frontend/dist)  │  │  (api/index.js -> Express)│
└───────────────────┘  └────────────┬─────────────┘
                                    │ Pool SSL (pg)
                                    ▼
                       ┌──────────────────────────┐
                       │  Supabase PostgreSQL 17  │
                       │  (11 tablas + RLS activo)│
                       └──────────────────────────┘
```

---

## 3. Estructura del Repositorio

```text
adopcion-mascotas-zulia/
├── api/
│   └── index.js                  # Punto de entrada Serverless para Vercel (/api/*)
├── backend/
│   ├── database/
│   │   ├── schema.sql            # Esquema relacional completo (ENUMs, tablas e índices)
│   │   └── seed.sql              # Datos semilla verificados del Estado Zulia
│   ├── src/
│   │   ├── config/               # Pool PostgreSQL (db.js) y configuración JWT
│   │   ├── controllers/          # Controladores HTTP por dominio
│   │   ├── middlewares/          # Autenticación RBAC, carga Multer y errores
│   │   ├── routes/               # Rutas REST (auth, mascotas, rescates, expedientes, solicitudes, admin)
│   │   ├── services/             # Lógica transaccional y consultas parametrizadas
│   │   ├── validators/           # Reglas express-validator
│   │   └── index.js              # Aplicación Express
│   └── test/
│       └── api.test.js           # Suite automatizada de pruebas de integración y seguridad
├── frontend/
│   ├── app/                      # Rutas Expo Router: (auth) y (tabs) por rol
│   ├── assets/                   # Identidad gráfica e iconos
│   └── src/
│       ├── components/           # Primitivas editoriales (ui.js), FilterBar, PetCard, estados
│       ├── constants/            # Paleta AA claro/oscuro (theme.js) y resolución de API
│       ├── contexts/             # AuthContext y ThemeContext
│       ├── hooks/                # Hook useAuth
│       └── services/             # Servicios HTTP por módulo
├── DESIGN.md                     # Documentación de decisiones visuales y tipográficas
├── package.json                  # Dependencias raíz para función serverless y scripts de build
├── vercel.json                   # Reglas de compilación, funciones y rewrites SPA/API
└── .env.example                  # Plantilla de variables de entorno
```

---

## 4. Base de Datos en Supabase (PostgreSQL 17)

El esquema consta de **9 tipos `ENUM`** y **11 tablas relacionales**:

1. `usuarios`: credenciales, rol, estado operativo y control de bloqueo temporal.
2. `perfiles_adoptante`: tipo de vivienda, cerramiento exterior, ingresos aproximados y experiencia.
3. `perfiles_rescatista`: organización o fundación y zona geográfica de cobertura.
4. `perfiles_veterinario`: matrícula profesional única, clínica asociada y especialidad.
5. `perfiles_administrador`: nivel de supervisión administrativa.
6. `rescates`: bitácora de hallazgos en campo, sector y condición física inicial.
7. `mascotas`: ficha integral, convivencia, salud, nutrición (`JSONB`), vacunas (`JSONB`) y constancias (`JSONB`).
8. `fotos_mascota`: galería asociada a cada animal con indicador de fotografía principal.
9. `expedientes_medicos`: historial veterinario con diagnóstico, tratamiento, peso y temperatura.
10. `solicitudes_adopcion`: postulaciones con respuestas socioeconómicas e índice único parcial `uq_solicitud_activa`.
11. `citas_adopcion`: entrevistas y entregas presenciales vinculadas a cada solicitud.

---

## 5. Endpoints Principales de la API REST

* `GET /api/health`: verificación de estado del servidor y conexión activa con Supabase.
* `POST /api/auth/register` y `POST /api/auth/login`: registro por rol e inicio de sesión con JWT.
* `GET /api/auth/me` y `PUT /api/auth/me`: consulta y actualización del perfil autenticado.
* `GET /api/mascotas`, `GET /api/mascotas/:id`, `POST /api/mascotas`, `PUT /api/mascotas/:id`, `DELETE /api/mascotas/:id`: gestión completa del catálogo y subida en `POST /api/mascotas/:id/fotos`.
* `GET /api/rescates` y `POST /api/rescates`: consulta y registro de operativos de rescate.
* `GET /api/expedientes`, `GET /api/mascotas/:id/expediente`, `POST /api/mascotas/:id/expediente`, `PUT /api/expedientes/:id`: bandeja médica e historias clínicas.
* `GET /api/solicitudes`, `POST /api/solicitudes`, `GET /api/solicitudes/:id`, `PATCH /api/solicitudes/:id/estado`: flujo de adopción y agendamiento de citas en `/api/solicitudes/:id/citas`.
* `GET /api/admin/reportes`, `GET /api/admin/usuarios`, `PATCH /api/admin/usuarios/:id/estado`: métricas globales y moderación administrativa.

---

## 6. Ejecución en Desarrollo Local

### Prerrequisitos
* **Node.js 20 LTS o superior** y **npm**.
* Instancia de **Supabase PostgreSQL** con el esquema aplicado (`backend/database/schema.sql`).

### Pasos
1. Instalar dependencias de raíz, backend y frontend:
   ```bash
   npm run install:all
   ```
2. Configurar `backend/.env` tomando como guía `.env.example`:
   ```env
   PORT=4000
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-1-us-east-1.pooler.supabase.com:5432/postgres
   JWT_SECRET=tu_clave_secreta_segura
   JWT_EXPIRATION=24h
   ```
3. Iniciar el servidor API (`http://localhost:4000`):
   ```bash
   cd backend && npm start
   ```
4. En otra terminal, iniciar la aplicación web (`http://localhost:8081`):
   ```bash
   cd frontend && npm run web
   ```
5. Ejecutar pruebas automatizadas de la API contra Supabase:
   ```bash
   npm run test:api
   ```

### Cuentas Semilla de Prueba (contraseña común: `Password123!`)
* **Adoptante**: `juan.adoptante@gmail.com`
* **Rescatista**: `maria.rescatista@fundacionhuellas.org`
* **Veterinario**: `vet.carlos@veterinariazulia.com`
* **Administrador**: `admin@adopcionzulia.org`

---

## 7. Despliegue Unificado en Vercel

El archivo `vercel.json` compila automáticamente la SPA de Expo en `frontend/dist` y despliega Express como función Node.js en `api/index.js`.

Variables requeridas en **Project Settings > Environment Variables** (`Production` y `Preview`):
* `DATABASE_URL`: cadena de conexión al Session Pooler IPv4 de Supabase.
* `JWT_SECRET`: secreto de firma para tokens JWT.
* `JWT_EXPIRATION`: `24h`.
* `NODE_ENV`: `production`.
