-- ============================================================
-- EPPD v1.0 - Row Level Security Policies
-- ============================================================

-- Habilitar RLS en todas las tablas
alter table profiles           enable row level security;
alter table entidades          enable row level security;
alter table vacantes           enable row level security;
alter table postulaciones      enable row level security;
alter table postulacion_historial enable row level security;
alter table notificaciones     enable row level security;
alter table solicitudes_arco   enable row level security;
alter table audit_log          enable row level security;
alter table country_config     enable row level security;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

create or replace function get_my_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function get_my_entidad_id()
returns uuid as $$
  select entidad_id from profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function is_admin()
returns boolean as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

-- ============================================================
-- PROFILES
-- ============================================================

-- Leer perfil propio
create policy "profiles_select_own"
  on profiles for select
  using (id = auth.uid());

-- Admin lee todos
create policy "profiles_select_admin"
  on profiles for select
  using (is_admin());

-- Proveedor/empresa ve perfiles de aspirantes que postularon a sus vacantes
create policy "profiles_select_proveedor_empresa"
  on profiles for select
  using (
    role = 'aspirante'
    and get_my_role() in ('proveedor', 'empresa_privada')
    and exists (
      select 1 from postulaciones p
      join vacantes v on p.vacante_id = v.id
      where p.aspirante_id = profiles.id
        and v.entidad_id = get_my_entidad_id()
    )
  );

-- Actualizar perfil propio
create policy "profiles_update_own"
  on profiles for update
  using (id = auth.uid());

-- Admin actualiza cualquiera
create policy "profiles_update_admin"
  on profiles for update
  using (is_admin());

-- ============================================================
-- ENTIDADES
-- ============================================================

-- Todos pueden ver entidades activas
create policy "entidades_select_public"
  on entidades for select
  using (activo = true);

-- Admin ve todas
create policy "entidades_select_admin"
  on entidades for select
  using (is_admin());

-- Admin modifica
create policy "entidades_all_admin"
  on entidades for all
  using (is_admin());

-- Proveedor/empresa ve su propia entidad (incluso inactiva)
create policy "entidades_select_own"
  on entidades for select
  using (id = get_my_entidad_id());

-- ============================================================
-- VACANTES
-- ============================================================

-- Todos (incluso anónimos) ven vacantes publicadas
create policy "vacantes_select_public"
  on vacantes for select
  using (estado = 'publicada');

-- Proveedor/empresa ve sus propias vacantes (todos los estados)
create policy "vacantes_select_own"
  on vacantes for select
  using (entidad_id = get_my_entidad_id());

-- Admin ve todas
create policy "vacantes_select_admin"
  on vacantes for select
  using (is_admin());

-- Proveedor crea vacantes para su entidad
create policy "vacantes_insert_proveedor"
  on vacantes for insert
  with check (
    get_my_role() = 'proveedor'
    and entidad_id = get_my_entidad_id()
  );

-- Empresa validada crea vacantes
create policy "vacantes_insert_empresa"
  on vacantes for insert
  with check (
    get_my_role() = 'empresa_privada'
    and entidad_id = get_my_entidad_id()
    and exists (select 1 from entidades where id = get_my_entidad_id() and validado = true)
  );

-- Proveedor/empresa actualiza sus propias vacantes
create policy "vacantes_update_own"
  on vacantes for update
  using (
    entidad_id = get_my_entidad_id()
    and get_my_role() in ('proveedor', 'empresa_privada')
  );

-- Admin actualiza cualquiera
create policy "vacantes_update_admin"
  on vacantes for update
  using (is_admin());

-- Solo borrador puede eliminarse
create policy "vacantes_delete_borrador"
  on vacantes for delete
  using (
    entidad_id = get_my_entidad_id()
    and estado = 'borrador'
    and get_my_role() in ('proveedor', 'empresa_privada')
  );

-- ============================================================
-- POSTULACIONES
-- ============================================================

-- Aspirante ve sus propias postulaciones
create policy "postulaciones_select_aspirante"
  on postulaciones for select
  using (aspirante_id = auth.uid());

-- Proveedor/empresa ve postulaciones a sus vacantes
create policy "postulaciones_select_proveedor_empresa"
  on postulaciones for select
  using (
    get_my_role() in ('proveedor', 'empresa_privada')
    and exists (
      select 1 from vacantes v
      where v.id = postulaciones.vacante_id
        and v.entidad_id = get_my_entidad_id()
    )
  );

-- Admin ve todas
create policy "postulaciones_select_admin"
  on postulaciones for select
  using (is_admin());

-- Aspirante crea postulación (solo si la vacante está publicada)
create policy "postulaciones_insert_aspirante"
  on postulaciones for insert
  with check (
    aspirante_id = auth.uid()
    and get_my_role() = 'aspirante'
    and exists (
      select 1 from vacantes v
      where v.id = postulaciones.vacante_id
        and v.estado = 'publicada'
    )
  );

-- Aspirante retira su postulación (solo antes del cierre de la vacante)
create policy "postulaciones_delete_aspirante"
  on postulaciones for delete
  using (
    aspirante_id = auth.uid()
    and exists (
      select 1 from vacantes v
      where v.id = postulaciones.vacante_id
        and v.estado = 'publicada'
    )
  );

-- Proveedor/empresa actualiza estado de postulaciones en sus vacantes
create policy "postulaciones_update_proveedor_empresa"
  on postulaciones for update
  using (
    get_my_role() in ('proveedor', 'empresa_privada')
    and exists (
      select 1 from vacantes v
      where v.id = postulaciones.vacante_id
        and v.entidad_id = get_my_entidad_id()
    )
  );

-- Admin actualiza cualquiera
create policy "postulaciones_update_admin"
  on postulaciones for update
  using (is_admin());

-- ============================================================
-- POSTULACION HISTORIAL
-- ============================================================

-- Aspirante ve historial de sus postulaciones
create policy "historial_select_aspirante"
  on postulacion_historial for select
  using (
    exists (
      select 1 from postulaciones p
      where p.id = postulacion_historial.postulacion_id
        and p.aspirante_id = auth.uid()
    )
  );

-- Proveedor/empresa ve historial de sus vacantes
create policy "historial_select_proveedor_empresa"
  on postulacion_historial for select
  using (
    get_my_role() in ('proveedor', 'empresa_privada')
    and exists (
      select 1 from postulaciones p
      join vacantes v on p.vacante_id = v.id
      where p.id = postulacion_historial.postulacion_id
        and v.entidad_id = get_my_entidad_id()
    )
  );

-- Admin ve todo
create policy "historial_select_admin"
  on postulacion_historial for select
  using (is_admin());

-- Proveedor/empresa inserta historial en sus vacantes
create policy "historial_insert_proveedor_empresa"
  on postulacion_historial for insert
  with check (
    get_my_role() in ('proveedor', 'empresa_privada')
    and cambiado_por = auth.uid()
  );

-- ============================================================
-- NOTIFICACIONES
-- ============================================================

-- Solo el dueño ve sus notificaciones
create policy "notificaciones_select_own"
  on notificaciones for select
  using (user_id = auth.uid());

-- Sistema inserta (service role) — usuarios no insertan directamente
-- Se inserta desde server-side con service role

-- Usuario marca como leída
create policy "notificaciones_update_own"
  on notificaciones for update
  using (user_id = auth.uid());

-- ============================================================
-- SOLICITUDES ARCO
-- ============================================================

-- Usuario ve sus propias solicitudes
create policy "arco_select_own"
  on solicitudes_arco for select
  using (user_id = auth.uid());

-- Admin ve todas
create policy "arco_select_admin"
  on solicitudes_arco for select
  using (is_admin());

-- Usuario crea su propia solicitud
create policy "arco_insert_own"
  on solicitudes_arco for insert
  with check (user_id = auth.uid());

-- Admin actualiza (procesa la solicitud)
create policy "arco_update_admin"
  on solicitudes_arco for update
  using (is_admin());

-- ============================================================
-- AUDIT LOG
-- ============================================================

-- Solo admin lee el log completo
create policy "audit_select_admin"
  on audit_log for select
  using (is_admin());

-- Cualquier usuario autenticado inserta su propio log
-- (desde server-side con service role en la práctica)
create policy "audit_insert_authenticated"
  on audit_log for insert
  with check (auth.uid() is not null);

-- ============================================================
-- COUNTRY CONFIG
-- ============================================================

-- Todos leen la config activa
create policy "country_config_select_public"
  on country_config for select
  using (active = true);

-- Solo admin modifica
create policy "country_config_all_admin"
  on country_config for all
  using (is_admin());
