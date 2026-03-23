import { createClient } from '@/lib/supabase/server'
import { OrientacionChat } from '@/components/shared/orientacion-chat'

export default async function OrientacionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, city, department')
    .eq('id', user!.id)
    .single()

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Orientación vocacional</h1>
        <p className="text-sm text-muted-foreground">
          Conversa con nuestro asistente de IA para descubrir las oportunidades que mejor se adaptan a ti
        </p>
      </div>
      <OrientacionChat
        userName={profile?.full_name ?? 'Aspirante'}
        userCity={profile?.city ?? undefined}
      />
    </div>
  )
}
