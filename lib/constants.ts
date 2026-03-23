export const APP_NAME = 'AVANZA AI Colombia'
export const APP_DESCRIPTION = 'Infraestructura Pública de IA Generativa para la Movilidad Económica Juvenil'
export const COUNTRY_CODE = process.env.NEXT_PUBLIC_COUNTRY_CODE ?? 'CO'

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  proveedor: 'Entidad Pública',
  empresa_privada: 'Empresa Privada',
  aspirante: 'Aspirante',
}

export const ROLE_REDIRECTS: Record<string, string> = {
  aspirante: '/aspirante/oportunidades',
  proveedor: '/proveedor',
  empresa_privada: '/empresa',
  admin: '/admin/transparencia',
}

export const VACANTE_ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  publicada: 'Publicada',
  evaluacion: 'En evaluación',
  cerrada: 'Cerrada',
  cancelada: 'Cancelada',
}

export const VACANTE_ESTADO_COLORS: Record<string, string> = {
  borrador: 'secondary',
  publicada: 'default',
  evaluacion: 'outline',
  cerrada: 'secondary',
  cancelada: 'destructive',
}

export const POSTULACION_ESTADO_LABELS: Record<string, string> = {
  registrada: 'Registrada',
  en_revision: 'En revisión',
  preseleccionada: 'Preseleccionada',
  seleccionada: 'Seleccionada',
  rechazada: 'No seleccionado',
}

export const POSTULACION_ESTADO_COLORS: Record<string, string> = {
  registrada: 'secondary',
  en_revision: 'outline',
  preseleccionada: 'default',
  seleccionada: 'default',
  rechazada: 'destructive',
}

export const DEPARTAMENTOS_CO = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
  'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
  'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
  'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
  'Vaupés', 'Vichada', 'Bogotá D.C.',
]

export const TIPOS_CONTRATO_PUBLICO = [
  { value: 'carrera', label: 'Carrera administrativa' },
  { value: 'provisional', label: 'Provisional' },
  { value: 'libre_nombramiento', label: 'Libre nombramiento y remoción' },
  { value: 'contrato_prestacion', label: 'Contrato de prestación de servicios' },
]

export const TIPOS_CONTRATO_PRIVADO = [
  { value: 'indefinido', label: 'Contrato indefinido' },
  { value: 'fijo', label: 'Contrato a término fijo' },
  { value: 'obra_labor', label: 'Obra o labor' },
  { value: 'aprendizaje', label: 'Contrato de aprendizaje' },
]

export const MODALIDADES = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'remoto', label: 'Remoto' },
  { value: 'hibrido', label: 'Híbrido' },
]

export const ARCO_TIPO_LABELS: Record<string, string> = {
  acceso: 'Solicitud de acceso',
  rectificacion: 'Rectificación de datos',
  supresion: 'Supresión de datos',
  revocacion: 'Revocación de consentimiento',
}

export const SALARIO_MIN_CO = 1300000
export const UPLOAD_MAX_SIZE_MB = 5
export const UPLOAD_ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
