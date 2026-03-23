-- ============================================================
-- EPPD v1.0 - Schema principal
-- Colombia (replicable por CountryConfig)
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- búsqueda de texto

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('admin', 'proveedor', 'empresa_privada', 'aspirante');
create type sector_type as enum ('publico', 'privado', 'mixto');
create type vacante_estado as enum ('borrador', 'publicada', 'evaluacion', 'cerrada', 'cancelada');
create type postulacion_estado as enum ('registrada', 'en_revision', 'preseleccionada', 'seleccionada', 'rechazada');
create type audit_action as enum ('INSERT', 'UPDATE', 'DELETE', 'READ_SENSITIVE', 'LOGIN', 'LOGOUT', 'EXPORT');
create type arco_tipo as enum ('acceso', 'rectificacion', 'supresion', 'revocacion');
create type arco_estado as enum ('pendiente', 'en_proceso', 'resuelta', 'escalada', 'rechazada');
create type documento_tipo as enum ('hv', 'identidad', 'titulo', 'certificacion', 'portafolio', 'soporte', 'camara_comercio', 'otro');

-- ============================================================
-- COUNTRY CONFIG
-- ============================================================

create table country_config (
  id          uuid primary key default uuid_generate_v4(),
  code        varchar(3) not null unique,
  name        varchar(100) not null,
  currency    varchar(10) not null,
  min_wage    integer not null,
  institutions jsonb not null default '[]',
  legal_framework jsonb not null default '{}',
  theme       jsonb not null default '{}',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- ENTIDADES
-- ============================================================

create table entidades (
  id                uuid primary key default uuid_generate_v4(),
  nombre            varchar(200) not null,
  tipo              sector_type not null,
  nit               varchar(20) not null unique,
  dv                varchar(2),
  activo            boolean not null default true,
  validado          boolean not null default false,
  nivel_gobierno    varchar(50),
  codigo_dane       varchar(20),
  sector_entidad    varchar(100),
  sector_economico  varchar(100),
  tamano_empresa    varchar(50),
  limite_vacantes   integer not null default 5,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- PROFILES (extiende auth.users de Supabase)
-- ============================================================

create table profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  role                  user_role not null,
  email                 varchar(255),
  full_name             varchar(200) not null,
  document_id           varchar(30) not null,
  document_type         varchar(20) not null default 'CC',
  phone                 varchar(20),
  city                  varchar(100),
  department            varchar(100),
  entidad_id            uuid references entidades(id),
  cargo_entidad         varchar(100),
  consentimiento_datos  boolean not null default false,
  fecha_consentimiento  timestamptz,
  solicitud_supresion   boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ============================================================
-- VACANTES
-- ============================================================

create table vacantes (
  id                    uuid primary key default uuid_generate_v4(),
  entidad_id            uuid not null references entidades(id),
  titulo                varchar(200) not null,
  descripcion           text not null,
  requisitos            text not null,
  salario_min           integer,
  salario_max           integer,
  ubicacion             varchar(200),
  departamento          varchar(100),
  municipio             varchar(100),
  tipo_contrato         varchar(50) not null,
  numero_convocatoria   varchar(50),
  presupuesto_programado integer,
  beneficios            text,
  estado                vacante_estado not null default 'borrador',
  fecha_cierre          date,
  visible_salario       boolean not null default true,
  visible_proceso       boolean not null default false,
  created_by            uuid not null references profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ============================================================
-- POSTULACIONES
-- ============================================================

create table postulaciones (
  id                    uuid primary key default uuid_generate_v4(),
  vacante_id            uuid not null references vacantes(id),
  aspirante_id          uuid not null references profiles(id),
  estado                postulacion_estado not null default 'registrada',
  justificacion_cambio  text,
  documentos            jsonb not null default '[]',
  -- [{url, tipo, nombre, tamaño, subido_at}]
  puntaje_total         decimal(5,2),
  codigo_seguimiento    varchar(20) not null unique,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint uq_postulacion unique (vacante_id, aspirante_id)
);

-- ============================================================
-- HISTORIAL DE ESTADOS (para pipeline y auditoría)
-- ============================================================

create table postulacion_historial (
  id                uuid primary key default uuid_generate_v4(),
  postulacion_id    uuid not null references postulaciones(id) on delete cascade,
  estado_anterior   postulacion_estado,
  estado_nuevo      postulacion_estado not null,
  justificacion     text not null,
  cambiado_por      uuid not null references profiles(id),
  created_at        timestamptz not null default now()
);

-- ============================================================
-- NOTIFICACIONES
-- ============================================================

create table notificaciones (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  titulo      varchar(200) not null,
  mensaje     text not null,
  leida       boolean not null default false,
  tipo        varchar(50) not null, -- estado_cambio, vacante_cierre, arco, sistema
  referencia_id uuid,               -- postulacion_id, vacante_id, etc.
  created_at  timestamptz not null default now()
);

-- ============================================================
-- SOLICITUDES ARCO
-- ============================================================

create table solicitudes_arco (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references profiles(id),
  tipo              arco_tipo not null,
  estado            arco_estado not null default 'pendiente',
  descripcion       text,
  respuesta         text,
  procesado_por     uuid references profiles(id),
  fecha_limite      date not null, -- 10 días hábiles desde created_at
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

create table audit_log (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references profiles(id),
  action        audit_action not null,
  table_name    varchar(100),
  record_id     uuid,
  old_data      jsonb,
  new_data      jsonb,
  ip_address    varchar(45),
  user_agent    text,
  path          varchar(500),
  tipo_acceso   varchar(20) not null default 'escritura', -- lectura | escritura
  created_at    timestamptz not null default now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

create index idx_vacantes_entidad_estado   on vacantes(entidad_id, estado);
create index idx_vacantes_estado           on vacantes(estado);
create index idx_vacantes_fecha_cierre     on vacantes(fecha_cierre);
create index idx_postulaciones_vacante     on postulaciones(vacante_id);
create index idx_postulaciones_aspirante   on postulaciones(aspirante_id);
create index idx_postulaciones_estado      on postulaciones(estado);
create index idx_historial_postulacion     on postulacion_historial(postulacion_id);
create index idx_notificaciones_user       on notificaciones(user_id, leida);
create index idx_audit_user_fecha         on audit_log(user_id, created_at);
create index idx_audit_tabla              on audit_log(table_name, created_at);
create index idx_arco_user               on solicitudes_arco(user_id);
create index idx_arco_estado             on solicitudes_arco(estado);

-- Búsqueda de texto en vacantes
create index idx_vacantes_titulo_trgm on vacantes using gin(titulo gin_trgm_ops);

-- ============================================================
-- FUNCIÓN: updated_at automático
-- ============================================================

create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function handle_updated_at();

create trigger trg_entidades_updated_at
  before update on entidades
  for each row execute function handle_updated_at();

create trigger trg_vacantes_updated_at
  before update on vacantes
  for each row execute function handle_updated_at();

create trigger trg_postulaciones_updated_at
  before update on postulaciones
  for each row execute function handle_updated_at();

create trigger trg_arco_updated_at
  before update on solicitudes_arco
  for each row execute function handle_updated_at();

-- ============================================================
-- FUNCIÓN: crear perfil al registrarse
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, role, email, full_name, document_id)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'aspirante'),
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'document_id', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- FUNCIÓN: código de seguimiento único
-- ============================================================

create or replace function generate_codigo_seguimiento()
returns text as $$
declare
  codigo text;
  existe boolean;
begin
  loop
    codigo := 'EP-' || upper(substring(md5(random()::text), 1, 8));
    select exists(select 1 from postulaciones where codigo_seguimiento = codigo) into existe;
    exit when not existe;
  end loop;
  return codigo;
end;
$$ language plpgsql;
