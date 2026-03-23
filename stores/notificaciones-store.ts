import { create } from 'zustand'

interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  leida: boolean
  tipo: string
  referencia_id: string | null
  created_at: string
}

interface NotificacionesStore {
  notificaciones: Notificacion[]
  noLeidas: number
  setNotificaciones: (notificaciones: Notificacion[]) => void
  marcarLeida: (id: string) => void
  marcarTodasLeidas: () => void
  agregarNotificacion: (n: Notificacion) => void
}

export const useNotificacionesStore = create<NotificacionesStore>((set) => ({
  notificaciones: [],
  noLeidas: 0,
  setNotificaciones: (notificaciones) =>
    set({
      notificaciones,
      noLeidas: notificaciones.filter((n) => !n.leida).length,
    }),
  marcarLeida: (id) =>
    set((state) => ({
      notificaciones: state.notificaciones.map((n) =>
        n.id === id ? { ...n, leida: true } : n
      ),
      noLeidas: Math.max(0, state.noLeidas - 1),
    })),
  marcarTodasLeidas: () =>
    set((state) => ({
      notificaciones: state.notificaciones.map((n) => ({ ...n, leida: true })),
      noLeidas: 0,
    })),
  agregarNotificacion: (n) =>
    set((state) => ({
      notificaciones: [n, ...state.notificaciones],
      noLeidas: state.noLeidas + (n.leida ? 0 : 1),
    })),
}))
