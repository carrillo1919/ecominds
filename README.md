# SRCD — Sistema de Registro y Control de Cumplimiento (Venezuela)

Etapa 1: **Autenticación y Roles**. Incluye registro, inicio de sesión con JWT, verificación de correo, recuperación de contraseña y control de acceso por roles (`admin`, `auditor`, `responsable`, `lector`).

```text
srcd/
├── backend/    Node.js + Express + Sequelize + PostgreSQL
└── frontend/   Vue 3 + Vite + Pinia + Vue Router
```

## Requisitos previos

- Node.js 18 o superior
- PostgreSQL 13 o superior (con la extensión `pgcrypto` disponible)
- Una cuenta SMTP para el envío de correos (opcional en desarrollo)

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env    # ajuste credenciales de base de datos y SMTP
```

Cree la base de datos y habilite `pgcrypto` (necesaria para `gen_random_uuid()`):

```sql
CREATE DATABASE srcd;
\c srcd
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

Ejecute migraciones, datos demo y el servidor:

```bash
npm run migrate
npm run seed
npm run dev        # http://localhost:3000
```

Verifique con `GET http://localhost:3000/api/health`.

### Variables de entorno (`backend/.env`)

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto del API (3000 por defecto) |
| `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`, `DB_DIALECT` | Conexión a PostgreSQL |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Firma y vigencia del token (24h por defecto) |
| `SMTP_HOST`, `SMTP_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | Envío de correos |
| `FRONTEND_URL` | Origen permitido por CORS y base de los enlaces de correo |

Si no configura SMTP, los correos no se envían: el contenido (incluido el enlace con el token) se imprime en la consola del servidor, lo que permite probar verificación y recuperación en desarrollo.

### Endpoints

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/api/health` | público |
| POST | `/api/auth/register` | público (siempre crea rol `lector`) |
| POST | `/api/auth/login` | público |
| GET | `/api/auth/verify-email?token=` | público |
| POST | `/api/auth/forgot-password` | público |
| POST | `/api/auth/reset-password` | público |
| GET | `/api/users/me` | autenticado |
| GET | `/api/users` | solo `admin` |
| PATCH | `/api/users/:id/rol` | solo `admin` |

### Usuarios demo (creados por `npm run seed`, ya verificados)

| Correo | Contraseña | Rol |
| --- | --- | --- |
| admin@srcd.local | `Admin123!` | admin |
| auditor@srcd.local | `Auditor123!` | auditor |
| responsable@srcd.local | `Responsable123!` | responsable |
| lector@srcd.local | `Lector123!` | lector |

Cambie estas contraseñas antes de cualquier despliegue real.

## 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:3000/api
npm run dev             # http://localhost:5173
```

Rutas: `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` (públicas) y `/dashboard`, `/usuarios` (protegidas; `/usuarios` requiere rol `admin`).

El token se guarda en `localStorage`; un interceptor de Axios lo adjunta en cada petición y, ante un `401`, cierra la sesión y redirige al login. El guardia `beforeEach` del router valida `meta.requiresAuth` y `meta.roles`.

## 3. Producción

```bash
# Backend
cd backend && npm ci --omit=dev && npm run migrate && npm start

# Frontend
cd frontend && npm ci && npm run build     # genera dist/
```

- Defina `NODE_ENV=production`, un `JWT_SECRET` largo y aleatorio, y `FRONTEND_URL` con el dominio real (CORS solo acepta ese origen; acepta varios separados por coma).
- Sirva `frontend/dist` desde Nginx u otro servidor estático con fallback a `index.html` (modo history del router).
- Coloque el API detrás de HTTPS y de un proxy inverso.

## Notas de seguridad

- Contraseñas con bcrypt (hook `beforeSave` del modelo `User`); nunca se devuelven en las respuestas.
- Tokens de verificación y de restablecimiento con `crypto.randomBytes`; el de restablecimiento expira en 1 hora y se limpia al usarse.
- `POST /api/auth/forgot-password` responde de forma genérica para no revelar si un correo existe.
- El rol no se acepta desde el registro público: solo un administrador puede modificarlo.

## Etapas siguientes

Modelos de negocio (Entes Reguladores, Requisitos Legales, Empresas), auditorías con listas de verificación, evidencias documentales, alertas por vencimiento, dashboards e informes PDF, y registro de auditoría (audit trail).

## Diseno y PWA (frontend)

- Layout con **sidebar lateral** colapsable (escritorio) y drawer deslizante con fondo oscuro (movil), barra superior con titulo de seccion y badge de rol.
- Sistema de diseno propio en `src/assets/main.css`: paleta institucional azul profundo + acento teal, tipografia Manrope, tarjetas, tablas, alertas y botones consistentes.
- **PWA instalable** via `vite-plugin-pwa` (`registerType: autoUpdate`): manifiesto, iconos 192/512 y maskable en `public/icons/`, theme-color y meta tags de iOS. El service worker solo se genera en `npm run build` (desactivado en desarrollo) y las navegaciones usan NetworkFirst, nunca cache-first.
- Para probar la instalacion: `npm run build && npm run preview` y usar "Instalar aplicacion" del navegador.

## Etapa 2 - Modulo de Auditoria

Modelo de datos nuevo: `Empresas`, `Requisitos` (checklist de 55 items MatPel VE),
`Auditorias` y `AuditoriaItems`.

Puesta en marcha:

```bash
cd backend
npm install
npm run migrate   # crea las tablas del modulo
npm run seed      # carga el checklist (55 requisitos) y usuarios demo
```

### Endpoints

| Metodo | Ruta | Rol | Descripcion |
| --- | --- | --- | --- |
| GET/POST/PUT | `/api/empresas` | lectura: todos, escritura: admin/auditor | Registro de empresas |
| GET | `/api/requisitos` | todos | Checklist vigente |
| PATCH | `/api/requisitos/:id` | admin | Configura requisitos criticos / vigencia (RF-03.3) |
| POST | `/api/auditorias` | admin/auditor | Crea la auditoria con el checklist completo |
| PUT | `/api/auditorias/:id/items` | admin/auditor | Guarda Cumple / No cumple / N/A, hallazgos y CAPA (RF-03.1) |
| POST | `/api/auditorias/:id/finalizar` | admin/auditor | Cierra la auditoria (requiere todos los items evaluados) |
| GET | `/api/auditorias/:id/informe.pdf` | todos | Informe Ejecutivo de Auditabilidad (RF-06.1) |
| GET | `/api/auditorias/estadisticas?desde&hasta&empresaId` | todos | KPIs del periodo (RF-06.2) |
| GET | `/api/auditorias/proximas?dias=30` | todos | Alertas de proxima auditoria |

### Calculo de riesgo (RF-03.2)

```
% No cumplimiento = Total No Cumple / (Total Requisitos - Total N/A) * 100
BAJO  < 15%      MEDIO 15% - 29,9%      ALTO >= 30%
```

Un incumplimiento en requisito critico sube un nivel la severidad; dos o mas la llevan a ALTO
(`src/services/riesgoService.js`, replicado en el frontend en `src/utils/riesgo.js`).
Criticos por defecto: G-02, G-03 (RACDA), G-14, G-15 (analisis de riesgo y plan de emergencia
LOPCYMAT/COVENIN 2226), T-01, T-05 y D-05; editables desde la pantalla Requisitos.

### Pantallas

`/empresas`, `/requisitos`, `/auditorias`, `/auditorias/:id` (checklist + matriz de riesgo en vivo
+ descarga PDF) y `/estadisticas` (tablero por periodo).
