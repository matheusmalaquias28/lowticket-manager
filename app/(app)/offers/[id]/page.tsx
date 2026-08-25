export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { OfferDossierClient } from './OfferDossierClient'
import type { Profile } from '@/lib/types'

interface Props {
  params: { id: string }
}

export default async function OfferDossierPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: offer } = await supabase.from('offers').select('*').eq('id', params.id).single()
  if (!offer) notFound()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return <OfferDossierClient offer={offer} profile={profile as Profile} />
}
