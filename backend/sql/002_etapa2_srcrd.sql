-- =====================================================================
-- SRCD | Etapa 2: entes reguladores, requisitos legales, empresas
-- y asignacion empresa <-> requisito.
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'ambito_ente') then
    create type public.ambito_ente as enum ('nacional', 'departamental', 'municipal', 'sectorial');
  end if;
  if not exists (select 1 from pg_type where typname = 'periodicidad_requisito') then
    create type public.periodicidad_requisito as enum ('unica', 'mensual', 'trimestral', 'semestral', 'anual');
  end if;
  if not exists (select 1 from pg_type where typname = 'criticidad_requisito') then
    create type public.criticidad_requisito as enum ('alta', 'media', 'baja');
  end if;
  if not exists (select 1 from pg_type where typname = 'estado_empresa') then
    create type public.estado_empresa as enum ('activa', 'inactiva', 'suspendida');
  end if;
end $$;

create table if not exists public.entes_reguladores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) between 3 and 160),
  sigla text not null check (char_length(trim(sigla)) between 2 and 20),
  ambito public.ambito_ente not null default 'nacional',
  contacto text check (char_length(contacto) <= 160),
  sitio_web text check (sitio_web is null or sitio_web ~* '^https?://'),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sigla)
);

grant select on public.entes_reguladores to authenticated;
grant all on public.entes_reguladores to service_role;
alter table public.entes_reguladores enable row level security;

create table if not exists public.requisitos_legales (
  id uuid primary key default gen_random_uuid(),
  ente_id uuid not null references public.entes_reguladores (id) on delete restrict,
  codigo text not null check (char_length(trim(codigo)) between 2 and 40),
  titulo text not null check (char_length(trim(titulo)) between 3 and 200),
  descripcion text check (char_length(descripcion) <= 2000),
  norma_respaldo text check (char_length(norma_respaldo) <= 200),
  categoria text not null check (char_length(trim(categoria)) between 3 and 80),
  periodicidad public.periodicidad_requisito not null default 'anual',
  criticidad public.criticidad_requisito not null default 'media',
  vigencia_desde date,
  vigencia_hasta date,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ente_id, codigo),
  check (vigencia_hasta is null or vigencia_desde is null or vigencia_hasta >= vigencia_desde)
);

create index if not exists requisitos_legales_ente_idx on public.requisitos_legales (ente_id);
create index if not exists requisitos_legales_categoria_idx on public.requisitos_legales (categoria);

grant select on public.requisitos_legales to authenticated;
grant all on public.requisitos_legales to service_role;
alter table public.requisitos_legales enable row level security;

create table if not exists public.empresa_requisitos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  requisito_id uuid not null references public.requisitos_legales (id) on delete restrict,
  fecha_asignacion date not null default current_date,
  responsable_id uuid references public.profiles (id) on delete set null,
  observaciones text check (char_length(observaciones) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, requisito_id)
);

create index if not exists empresa_requisitos_empresa_idx on public.empresa_requisitos (empresa_id);
create index if not exists empresa_requisitos_requisito_idx on public.empresa_requisitos (requisito_id);

grant select on public.empresa_requisitos to authenticated;
grant all on public.empresa_requisitos to service_role;
alter table public.empresa_requisitos enable row level security;

-- Triggers updated_at
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['entes_reguladores', 'requisitos_legales', 'empresas', 'empresa_requisitos']
  LOOP
    EXECUTE format('drop trigger if exists %I_touch_updated_at on public.%I', t, t);
    EXECUTE format(
      'create trigger %I_touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- RLS
DROP POLICY IF EXISTS "entes_select_auth" ON public.entes_reguladores;
CREATE POLICY "entes_select_auth"
  ON public.entes_reguladores FOR SELECT TO authenticated
  USING (public.current_app_role() IS NOT NULL);

DROP POLICY IF EXISTS "entes_write_staff" ON public.entes_reguladores;
CREATE POLICY "entes_write_staff"
  ON public.entes_reguladores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'auditor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'auditor'));

DROP POLICY IF EXISTS "requisitos_select_auth" ON public.requisitos_legales;
CREATE POLICY "requisitos_select_auth"
  ON public.requisitos_legales FOR SELECT TO authenticated
  USING (public.current_app_role() IS NOT NULL);

DROP POLICY IF EXISTS "requisitos_write_staff" ON public.requisitos_legales;
CREATE POLICY "requisitos_write_staff"
  ON public.requisitos_legales FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'auditor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'auditor'));

DROP POLICY IF EXISTS "empresas_select_auth" ON public.empresas;
CREATE POLICY "empresas_select_auth"
  ON public.empresas FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'auditor')
    OR public.has_role(auth.uid(), 'lector')
    OR responsable_id = auth.uid()
  );

DROP POLICY IF EXISTS "empresas_write_staff" ON public.empresas;
CREATE POLICY "empresas_write_staff"
  ON public.empresas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'auditor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'auditor'));

DROP POLICY IF EXISTS "empresa_requisitos_select_auth" ON public.empresa_requisitos;
CREATE POLICY "empresa_requisitos_select_auth"
  ON public.empresa_requisitos FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'auditor')
    OR public.has_role(auth.uid(), 'lector')
    OR responsable_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.responsable_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "empresa_requisitos_write_staff" ON public.empresa_requisitos;
CREATE POLICY "empresa_requisitos_write_staff"
  ON public.empresa_requisitos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'auditor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'auditor'));

-- Datos demo
insert into public.entes_reguladores (nombre, sigla, ambito, contacto, sitio_web, activo) values
  ('Servicio de Impuestos Nacionales', 'SIN', 'nacional', 'contacto@sin.gob', 'https://www.impuestos.gob.bo', true),
  ('Ministerio de Trabajo, Empleo y Prevision Social', 'MTEPS', 'nacional', 'consultas@mteps.gob', 'https://www.mtilde.gob.bo', true),
  ('Gobierno Autonomo Municipal de La Paz', 'GAMLP', 'municipal', 'tramites@lapaz.bo', 'https://www.lapaz.bo', true)
on conflict (sigla) do nothing;

insert into public.requisitos_legales
  (ente_id, codigo, titulo, descripcion, norma_respaldo, categoria, periodicidad, criticidad, vigencia_desde, activo)
select e.id, v.codigo, v.titulo, v.descripcion, v.norma, v.categoria,
       v.periodicidad::public.periodicidad_requisito,
       v.criticidad::public.criticidad_requisito,
       v.vigencia_desde::date, true
from (values
  ('SIN',   'SIN-IVA-01',  'Declaracion mensual del IVA', 'Presentacion del formulario 200 de IVA dentro del plazo por terminacion de NIT.', 'Ley 843 art. 10', 'Tributario', 'mensual', 'alta', '2026-01-01'),
  ('SIN',   'SIN-IT-02',   'Declaracion mensual del IT', 'Formulario 400 del Impuesto a las Transacciones.', 'Ley 843 art. 72', 'Tributario', 'mensual', 'alta', '2026-01-01'),
  ('SIN',   'SIN-IUE-03',  'Declaracion anual del IUE', 'Formulario 500 con estados financieros auditados.', 'Ley 843 art. 36', 'Tributario', 'anual', 'alta', '2026-01-01'),
  ('SIN',   'SIN-LCV-04',  'Libro de compras y ventas', 'Envio mensual del registro de compras y ventas IVA.', 'RND 102000000011', 'Tributario', 'mensual', 'media', '2026-01-01'),
  ('SIN',   'SIN-FAC-05',  'Facturacion en linea', 'Emision de facturas mediante modalidad en linea autorizada.', 'RND 102100000011', 'Tributario', 'unica', 'alta', '2026-01-01'),
  ('MTEPS', 'MT-PLA-01',   'Planillas trimestrales de sueldos', 'Declaracion trimestral de planillas en oficina virtual.', 'RM 218/2015', 'Laboral', 'trimestral', 'alta', '2026-01-01'),
  ('MTEPS', 'MT-RE-02',    'Registro obligatorio de empleadores', 'Actualizacion anual del ROE.', 'RM 872/2012', 'Laboral', 'anual', 'media', '2026-01-01'),
  ('MTEPS', 'MT-SEG-03',   'Programa de seguridad y salud ocupacional', 'Aprobacion y actualizacion del programa anual.', 'DS 2936', 'Seguridad ocupacional', 'anual', 'alta', '2026-01-01'),
  ('MTEPS', 'MT-RIT-04',   'Reglamento interno de trabajo', 'Homologacion del reglamento interno vigente.', 'LGT art. 4', 'Laboral', 'unica', 'media', '2026-01-01'),
  ('GAMLP', 'GM-LF-01',    'Licencia de funcionamiento municipal', 'Obtencion y renovacion de la licencia de funcionamiento.', 'Ley Municipal 012', 'Municipal', 'anual', 'alta', '2026-01-01'),
  ('GAMLP', 'GM-PUB-02',   'Autorizacion de publicidad exterior', 'Permiso para rotulos y publicidad en via publica.', 'Ley Municipal 057', 'Municipal', 'anual', 'baja', '2026-01-01'),
  ('GAMLP', 'GM-RES-03',   'Gestion de residuos solidos', 'Reporte semestral de manejo de residuos.', 'Ley Municipal 001', 'Ambiental', 'semestral', 'media', '2026-01-01')
) as v(sigla, codigo, titulo, descripcion, norma, categoria, periodicidad, criticidad, vigencia_desde)
join public.entes_reguladores e on e.sigla = v.sigla
on conflict (ente_id, codigo) do nothing;

insert into public.empresa_requisitos (empresa_id, requisito_id, fecha_asignacion, responsable_id, observaciones)
select em.id, r.id, current_date,
       (select id from auth.users where email = 'responsable@srcd.local'),
       'Asignacion inicial de datos demo'
from public.empresas em
join public.requisitos_legales r on r.codigo in ('SIN-IVA-01', 'SIN-IT-02', 'SIN-IUE-03', 'GM-LF-01', 'GM-PUB-02')
where em.nit = '1023456789'
on conflict (empresa_id, requisito_id) do nothing;

insert into public.empresa_requisitos (empresa_id, requisito_id, fecha_asignacion, responsable_id, observaciones)
select em.id, r.id, current_date,
       (select id from auth.users where email = 'responsable@srcd.local'),
       'Asignacion inicial de datos demo'
from public.empresas em
join public.requisitos_legales r on r.codigo in ('MT-PLA-01', 'MT-SEG-03', 'GM-RES-03', 'SIN-IVA-01')
where em.nit = '2098765432'
on conflict (empresa_id, requisito_id) do nothing;
