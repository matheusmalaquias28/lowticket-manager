export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OffersPageClient } from './OffersPageClient'
import type { Profile } from '@/lib/types'

export default async function OffersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return <OffersPageClient profile={profile as Profile} />
}
