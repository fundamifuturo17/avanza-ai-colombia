-- ============================================================
-- EPPD v1.0 - Seed Data Colombia
-- ============================================================

-- CountryConfig Colombia
insert into country_config (code, name, currency, min_wage, institutions, legal_framework, theme, active)
values (
  'CO',
  'Colombia',
  'COP',
  1300000,
  '["RUES", "DIAN", "MinTrabajo", "SENA", "ESAP", "SIC"]'::jsonb,
  '{
    "leyes": [
      {"codigo": "Ley 909 de 2004", "descripcion": "Empleo público y carrera administrativa"},
      {"codigo": "Ley 1581 de 2012", "descripcion": "Protección de datos personales (Habeas Data)"},
      {"codigo": "Ley 1712 de 2014", "descripcion": "Transparencia y acceso a información pública"}
    ],
    "plazos_arco_dias_habiles": 10,
    "tipos_contrato_publico": ["carrera", "provisional", "libre_nombramiento", "contrato_prestacion"],
    "tipos_contrato_privado": ["indefinido", "fijo", "obra_labor", "aprendizaje"]
  }'::jsonb,
  '{
    "primary": "#1a56db",
    "secondary": "#0e9f6e",
    "nombre_sistema": "EPPD Colombia"
  }'::jsonb,
  true
);

-- ============================================================
-- ENTIDADES PÚBLICAS
-- ============================================================

insert into entidades (nombre, tipo, nit, dv, activo, validado, nivel_gobierno, sector_entidad)
values
  ('Ministerio de Salud y Protección Social', 'publico', '899999001', '6', true, true, 'nacional', 'salud'),
  ('Hospital Universitario Nacional', 'publico', '899999068', '7', true, true, 'nacional', 'salud'),
  ('Instituto Colombiano de Bienestar Familiar', 'publico', '800087031', '7', true, true, 'nacional', 'bienestar'),
  ('Secretaría de Hacienda de Bogotá', 'publico', '899999042', '1', true, true, 'distrital', 'hacienda');

-- ============================================================
-- EMPRESAS PRIVADAS
-- ============================================================

insert into entidades (nombre, tipo, nit, dv, activo, validado, sector_economico, tamano_empresa, limite_vacantes)
values
  ('TechSalud SAS', 'privado', '901234567', '8', true, true, 'tecnologia', 'mediana', 10),
  ('LogNorte Ltda', 'privado', '800123456', '7', true, true, 'logistica', 'pequena', 5),
  ('AmbConsul SAS', 'privado', '860987654', '3', true, false, 'consultoria', 'pequena', 5);

-- ============================================================
-- NOTA: Los usuarios (profiles) se crean mediante Supabase Auth
-- Los siguientes son perfiles de demo para pruebas funcionales
-- Deben crearse con el trigger handle_new_user
-- ============================================================
