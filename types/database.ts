export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'proveedor' | 'empresa_privada' | 'aspirante'
export type SectorType = 'publico' | 'privado' | 'mixto'
export type VacanteEstado = 'borrador' | 'publicada' | 'evaluacion' | 'cerrada' | 'cancelada'
export type PostulacionEstado = 'registrada' | 'en_revision' | 'preseleccionada' | 'seleccionada' | 'rechazada'
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'READ_SENSITIVE' | 'LOGIN' | 'LOGOUT' | 'EXPORT'
export type ArcoTipo = 'acceso' | 'rectificacion' | 'supresion' | 'revocacion'
export type ArcoEstado = 'pendiente' | 'en_proceso' | 'resuelta' | 'escalada' | 'rechazada'
export type DocumentoTipo = 'hv' | 'identidad' | 'titulo' | 'certificacion' | 'portafolio' | 'soporte' | 'camara_comercio' | 'otro'

export interface DocumentoPostulacion {
  url: string
  tipo: DocumentoTipo
  nombre: string
  tamanio: number
  subido_at: string
}

export interface Database {
  public: {
    Tables: {
      country_config: {
        Row: {
          id: string
          code: string
          name: string
          currency: string
          min_wage: number
          institutions: Json
          legal_framework: Json
          theme: Json
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['country_config']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['country_config']['Insert']>
      }
      entidades: {
        Row: {
          id: string
          nombre: string
          tipo: SectorType
          nit: string
          dv: string | null
          activo: boolean
          validado: boolean
          nivel_gobierno: string | null
          codigo_dane: string | null
          sector_entidad: string | null
          sector_economico: string | null
          tamano_empresa: string | null
          limite_vacantes: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['entidades']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['entidades']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          role: UserRole
          email: string | null
          full_name: string
          document_id: string
          document_type: string
          phone: string | null
          city: string | null
          department: string | null
          entidad_id: string | null
          cargo_entidad: string | null
          consentimiento_datos: boolean
          fecha_consentimiento: string | null
          solicitud_supresion: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      vacantes: {
        Row: {
          id: string
          entidad_id: string
          titulo: string
          descripcion: string
          requisitos: string
          salario_min: number | null
          salario_max: number | null
          ubicacion: string | null
          departamento: string | null
          municipio: string | null
          tipo_contrato: string
          numero_convocatoria: string | null
          presupuesto_programado: number | null
          beneficios: string | null
          estado: VacanteEstado
          fecha_cierre: string | null
          visible_salario: boolean
          visible_proceso: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['vacantes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['vacantes']['Insert']>
      }
      postulaciones: {
        Row: {
          id: string
          vacante_id: string
          aspirante_id: string
          estado: PostulacionEstado
          justificacion_cambio: string | null
          documentos: Json
          puntaje_total: number | null
          codigo_seguimiento: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['postulaciones']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['postulaciones']['Insert']>
      }
      postulacion_historial: {
        Row: {
          id: string
          postulacion_id: string
          estado_anterior: PostulacionEstado | null
          estado_nuevo: PostulacionEstado
          justificacion: string
          cambiado_por: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['postulacion_historial']['Row'], 'id' | 'created_at'>
        Update: never
      }
      notificaciones: {
        Row: {
          id: string
          user_id: string
          titulo: string
          mensaje: string
          leida: boolean
          tipo: string
          referencia_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notificaciones']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notificaciones']['Insert']>
      }
      solicitudes_arco: {
        Row: {
          id: string
          user_id: string
          tipo: ArcoTipo
          estado: ArcoEstado
          descripcion: string | null
          respuesta: string | null
          procesado_por: string | null
          fecha_limite: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['solicitudes_arco']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['solicitudes_arco']['Insert']>
      }
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: AuditAction
          table_name: string | null
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          path: string | null
          tipo_acceso: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      sector_type: SectorType
      vacante_estado: VacanteEstado
      postulacion_estado: PostulacionEstado
      audit_action: AuditAction
      arco_tipo: ArcoTipo
      arco_estado: ArcoEstado
    }
  }
}
