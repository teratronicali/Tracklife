import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import type { Perfil } from '@/lib/types'

export default async function OnboardingPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single<Perfil>()
  if (!perfil) redirect('/login')
  if (perfil.onboarding_completado) redirect('/dashboard')

  return <OnboardingWizard perfil={perfil} usuarioId={user.id} />
}
