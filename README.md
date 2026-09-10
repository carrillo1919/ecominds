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

Todas las rutas del API se registran en `backend/src/bootstrap/routes.js` y se montan bajo `/api` desde `backend/src/bootstrap/app.js`.

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
| GET/POST/PUT | `/api/empresas` | lectura: todos, escritura: admin/auditor |
| GET/POST/PUT/PATCH/DELETE | `/api/entes-reguladores` | lectura: autenticado, escritura: admin/auditor |
| GET/POST/PUT/PATCH/DELETE | `/api/requisitos-legales` | lectura: autenticado, escritura: admin/auditor |
| GET/POST/PUT/DELETE | `/api/empresa-requisitos` | lectura: autenticado, escritura: admin/auditor |
| GET/POST/PUT/DELETE | `/api/requisitos` | todos (lectura), admin (configuración) |
| GET/POST/PATCH/PUT/DELETE | `/api/auditorias` | ver módulo de auditoría |
| GET/POST/PUT/DELETE | `/api/empleados` | ver módulo de empleados |
| GET/POST/PUT/DELETE | `/api/documentos` | ver módulo de documentos |

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

Rutas públicas: `/app/login`, `/app/register`, `/app/verify-email`, `/app/forgot-password`, `/app/reset-password` y `/` (landing). Rutas protegidas bajo `/app/*` (ej. `/app/dashboard`, `/app/usuarios`). `/app/usuarios` requiere rol `admin`.

El token se guarda en `localStorage`; un interceptor de Axios lo adjunta en cada petición y, ante un `401`, cierra la sesión y redirige al login. El guardia `beforeEach` del router valida `meta.requiresAuth` y `meta.roles`. Todas las vistas usan lazy loading, excepto `LoginView` (carga inmediata para el primer render).

### Estructura de carpetas del frontend

```text
frontend/src/
├── api/              # Clientes Axios por dominio
├── assets/           # Estilos, imágenes, fuentes
├── components/
│   ├── ui/           # Componentes base reutilizables (BaseButton, BaseInput, BaseTable, etc.)
│   ├── auditoria/    # Componentes de dominio (AuditRiskMatrix, AuditItemRow)
│   └── landing/      # Componentes de la landing page
├── composables/      # Lógica reutilizable (useAuthorization)
├── router/           # Configuración de rutas
├── stores/           # Stores Pinia por dominio
├── utils/            # Utilidades (riesgo, validadores)
└── views/            # Vistas organizadas por dominio
    ├── auth/
    ├── administracion/
    ├── cumplimiento/
    ├── auditoria/
    ├── empleados/
    ├── documentos/
    └── sistema/
```

### Convenciones

- **Vistas y componentes**: `PascalCase.vue`.
- **Stores, composables y archivos JS**: `camelCase.js`.
- **Alias `@`**: apunta a `frontend/src` (configurado en `vite.config.js`).
- **Lazy loading por defecto** en el router; solo `LoginView` se carga de forma eager.
- **Estado centralizado** en Pinia: las vistas leen del store, disparan acciones y renderizan.

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
(`src/modules/auditorias/application/risk-calculator.js`, replicado en el frontend en `src/utils/riesgo.js`).
Criticos por defecto: G-02, G-03 (RACDA), G-14, G-15 (analisis de riesgo y plan de emergencia
LOPCYMAT/COVENIN 2226), T-01, T-05 y D-05; editables desde la pantalla Requisitos.

### Pantallas

`/app/empresas`, `/app/requisitos`, `/app/auditorias`, `/app/auditorias/:id` (checklist + matriz de riesgo en vivo
+ descarga PDF) y `/app/estadisticas` (tablero por periodo).

## Notas para desarrolladores

### Cómo agregar una nueva vista

1. Cree el componente `.vue` en `frontend/src/views/<dominio>/`.
2. Registre la ruta en `frontend/src/router/index.js` usando lazy loading: `component: () => import('@/views/<dominio>/NuevaView.vue')`.
3. Si la vista requiere datos, cree o extienda el store correspondiente en `frontend/src/stores/`.
4. Use los componentes base de `frontend/src/components/ui/` para mantener consistencia.

### Cómo agregar un nuevo componente reutilizable

- Componentes base de UI: `frontend/src/components/ui/NombreComponente.vue`.
- Componentes de dominio: `frontend/src/components/<dominio>/NombreComponente.vue`.
- Expona props claras, use slots para contenido variable y mantenga el componente sin lógica de negocio acoplada.

### Cómo agregar un nuevo endpoint

1. Identifique el módulo de dominio en `backend/src/modules/<dominio>/` (o cree uno nuevo siguiendo la estructura descrita abajo).
2. Cree o extienda el controller en `backend/src/modules/<dominio>/http/controllers/`.
3. Defina las rutas en el archivo de router correspondiente en `backend/src/modules/<dominio>/http/routes/`.
4. Importe y monte el router en `backend/src/bootstrap/routes.js` bajo el prefijo adecuado.
5. Aplique los middlewares `authenticate` y `authorize` según el acceso requerido.
6. Actualice este `README.md` con el nuevo endpoint.

## Arquitectura del backend

El backend sigue una arquitectura híbrida **por módulo de dominio + código compartido**:

```
backend/src/
  bootstrap/          # composición de la aplicación
    app.js            # instancia Express, middlewares globales, manejo de errores
    server.js         # arranque: DB, SMTP, jobs programados
    routes.js         # montaje central de todos los routers bajo /api
  shared/             # código transversal y estable (sin lógica de negocio)
    database/         # conexión Sequelize
    security/         # auth, CSRF, tokens, scope multiempresa, RLS
    http/
      errors/         # HttpError y manejador global de errores
      validation/     # middleware validate + primitivas de validación
    observability/    # logger (winston)
    infrastructure/
      email/          # proveedor de correo (emailService.js), layout base y assets
  modules/            # un módulo por dominio del negocio (nombres en español)
    identidad/        # autenticación y usuarios
    organizaciones/   # empresas y empleados
    cumplimiento/     # entes reguladores, requisitos legales y su asignación
    auditorias/       # auditorías, cálculo de riesgo e informes
    documentos/       # documentos y archivos adjuntos
    calendario/       # eventos de calendario
    notificaciones/   # configuración y envío de notificaciones
    comercial/        # productos, servicios y facturación
  models/index.js     # registro agregado de modelos Sequelize
```

El código de **soporte de base de datos y pruebas** vive fuera de `src/`, en una carpeta
independiente que **no forma parte del runtime**:

```
backend/tools/        # NO se importa desde src/ — el sistema arranca sin esta carpeta
  sequelize-cli.cjs   # configuración del CLI de Sequelize
  migrations/         # migraciones (sequelize-cli)
  seeders/            # seeders (sequelize-cli)
  tests/              # pruebas de integración (node --test / scripts)
```

> **Independencia del runtime:** nada dentro de `backend/src/` importa desde `backend/tools/`.
> Si se elimina `backend/tools/`, el servidor arranca y la API funciona con normalidad;
> solo se pierden los comandos `npm run migrate`, `npm run seed` y `npm run test:email`.

> **Publicacion al repositorio del colaborador:** `backend/tools/` se queda **solo** en el
> repositorio principal (`carrillo1919/ecominds`). Al publicar `backend/` en
> `ecominds04-design/ecominds-banckend` se usa `scripts/push-backend.ps1`, que genera el
> subtree split y elimina `tools/` antes de empujar. Ver [Publicar en los repositorios del colaborador](#publicar-en-los-repositorios-del-colaborador).

Cada módulo usa capas ligeras:

```
modules/<dominio>/
  http/               # adaptador HTTP
    routes/           # definición de rutas (Express Router)
    controllers/      # controllers (adaptadores finos)
    middlewares/      # validadores y middlewares propios del dominio
  application/        # servicios de aplicación (reglas de negocio)
  infrastructure/     # modelos Sequelize y plantillas propias del dominio
    models/           # modelos Sequelize del dominio
    email/            # plantillas de correo del dominio
    pdf/              # plantillas PDF del dominio (si aplica)
  jobs/               # tareas programadas del dominio (si aplica)
  index.js            # API pública del módulo (solo si otros módulos lo consumen)
```

### Plantillas de correo y PDF

- `shared/infrastructure/email/` contiene **solo lo transversal**: `emailService.js`
  (transporte SMTP, `sendEmail`, `sendEmailWithTemplate`, `buildEmailTemplate`),
  `layout.js` (estructura HTML común) y `assets/` (logo).
- Cada **plantilla de negocio vive en el módulo dueño del dominio**, en
  `modules/<dominio>/infrastructure/email/`, y se consume a través de un
  `modules/<dominio>/application/emailService.js` que arma y envía el correo.
- Lo mismo aplica a los PDF: `modules/auditorias/infrastructure/pdf/informe-auditoria.js`
  y `modules/comercial/infrastructure/pdf/factura.js`.

### Reglas de dependencia

- **HTTP es un adaptador fino:** `route -> controller -> application service`.
- Los **controllers no contienen reglas de negocio ni consultas Sequelize**.
- Los **jobs llaman a servicios de aplicación**, nunca a controllers.
- Un módulo **no importa internals de otro módulo**; si necesita colaboración, importa desde el `index.js` público del módulo propietario.
- `shared/` solo contiene código transversal y estable; nunca lógica de negocio.
- No se permiten dependencias circulares entre módulos.

### Cómo agregar un nuevo módulo

1. Cree `backend/src/modules/<dominio>/` con las carpetas `http/{routes,controllers,middlewares}/`, `application/` e `infrastructure/{models,email,pdf}/`.
2. Mueva allí las rutas, controllers, validadores, servicios y modelos del dominio.
3. Registre los modelos en `backend/src/models/index.js`.
4. Monte el router en `backend/src/bootstrap/routes.js`.
5. Si otro módulo necesita consumirlo, exponga una API pública en `modules/<dominio>/index.js`.



## Publicar en los repositorios del colaborador

El repositorio principal (`carrillo1919/ecominds`) contiene `backend/` y `frontend/`.
Los repositorios del colaborador reciben **solo** el contenido de cada carpeta, sin el
prefijo, mediante `git subtree split`.

```powershell
# 1. Verificar que queden solo origin, backend-origin y frontend-origin
git remote -v

# 2. Subir solo la carpeta backend (EXCLUYENDO backend/tools/)
#    El script hace el split, elimina tools/ de la rama y empuja.
#    Desde la raiz del repositorio:
powershell -ExecutionPolicy Bypass -File scripts/push-backend.ps1

#    Equivalente manual (si no se usa el script):
#    git subtree split --prefix=backend -b backend-only
#    git checkout backend-only
#    git rm -r --cached tools
#    git commit -m "chore: excluir tools/ del repositorio de despliegue"
#    git push backend-origin backend-only:main --force
#    git checkout main
#    git branch -D backend-only

# 3. Subir solo la carpeta frontend
powershell -ExecutionPolicy Bypass -File scripts/push-frontend.ps1

#    Equivalente manual:
#    git subtree split --prefix=frontend -b frontend-only
#    git push frontend-origin frontend-only:main --force
#    git branch -D frontend-only
```

> **Nota:** use `powershell` (Windows PowerShell 5.1, incluido en Windows). `pwsh` solo
> existe si tiene instalado PowerShell 7. Los scripts funcionan con ambos.

Destinos:

- https://github.com/ecominds04-design/ecominds-banckend.git
- https://github.com/ecominds04-design/ecominds-frontend.git

> **Importante:** `backend/tools/` (migraciones, seeders y pruebas) **nunca** se publica en
> el repositorio del colaborador. `git subtree split` no soporta exclusiones, por eso los
> scripts `scripts/push-backend.ps1` y `scripts/push-frontend.ps1` automatizan el split,
> la eliminacion de `tools/` y el push. Use `-DryRun` para previsualizar sin empujar.


cerrar puerto 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object LocalPort, State, OwningProcess

Stop-Process -Id 18620 -Force

Ejecuta estos comandos en **PowerShell** desde la carpeta del backend. Primero verificamos la conexión con el pooler, luego el estado de las migraciones.

## 1. Verificar la conexión con Supabase

```powershell
cd c:\Users\tf carrillo\Documents\proyectos\ecoMinds\backend

node -e "const {Client} = require('pg'); const c = new Client({connectionString: 'postgresql://postgres.fbrojwoojkqwheujvlyy:cV208v7xwZUPnxO0@aws-0-us-west-2.pooler.supabase.com:6543/postgres'}); c.connect().then(()=>{console.log('OK'); process.exit(0)}).catch(e=>{console.error(e.message); process.exit(1)})"
```

Si sale `OK`, la conexión funciona.

---

## 2. Ver qué migraciones faltan

```powershell
npx sequelize-cli db:migrate:status --config tools/sequelize-cli.cjs --migrations-path tools/migrations
```

Verás una tabla como esta:

```
┌──────────────────────────────────────────────┬───────────────┐
│ Migration                                    │ Status        │
├──────────────────────────────────────────────┼───────────────┤
│ 20260101000000-create-users.js               │ down          │
│ 20260201000000-create-auditoria-module.js    │ down          │
│ ...                                          │ down          │
└──────────────────────────────────────────────┴───────────────┘
```

Todo `down` significa que la base de datos está vacía y falta todo.

---

## 3. Aplicar todas las migraciones pendientes

```powershell
npx sequelize-cli db:migrate --config tools/sequelize-cli.cjs --migrations-path tools/migrations
```

Si falla en alguna, el error te dirá cuál. Puedes revisar el archivo correspondiente y corregirlo, o aplicarlas una por una con:

```powershell
npx sequelize-cli db:migrate --to 20260830000002-create-documentos.js --config tools/sequelize-cli.cjs --migrations-path tools/migrations
```

Esto aplicará solo hasta esa migración.

---

## 4. Verificar de nuevo el estado

```powershell
npx sequelize-cli db:migrate:status --config tools/sequelize-cli.cjs --migrations-path tools/migrations
```

Ahora todo debería estar en `up`.

También puedes verificar en **Supabase Dashboard → Table Editor** que existan las tablas. O ejecutar esta consulta en el **SQL Editor**:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

---

## 5. Ejecutar los seeders

```powershell
npx sequelize-cli db:seed:all --config tools/sequelize-cli.cjs --seeders-path tools/seeders
```

Esto ejecutará los seeders en orden alfabético:

1. `20260101000100-demo-users.js`
2. `20260201000100-checklist-matpel.js`
3. `20260824000001-entes-reguladores.js`
4. `20260824000002-requisitos-legales.js`
5. `20260824000003-empresas-demo.js`
6. `20260824000004-empresa-requisitos.js`

Si necesitas verificar qué datos se insertaron, usa en el SQL Editor:

```sql
SELECT COUNT(*) FROM "Users";
SELECT COUNT(*) FROM "Empresas";
SELECT COUNT(*) FROM "Documentos";
```

---

## Resumen

| Paso | Comando |
|---|---|
| Ver conexión | `node -e "..."` |
| Ver estado migraciones | `db:migrate:status` |
| Aplicar migraciones | `db:migrate` |
| Verificar estado | `db:migrate:status` |
| Ejecutar seeders | `db:seed:all` |

Si en el paso 1 sale error, el proyecto Supabase está en **pausa** o la URL/región no coincide. Ve al dashboard y restaura el proyecto si está pausado.