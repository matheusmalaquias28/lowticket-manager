'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID

export function OneSignalInit({ userId }: { userId: string }) {
  const supabase = createClient()

  useEffect(() => {
    if (!APP_ID) return

    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({
        appId: APP_ID,
        allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
      })

      const savePlayerId = async () => {
        const playerId = OneSignal.User.PushSubscription.id
        if (playerId) {
          await supabase.from('profiles').update({ onesignal_player_id: playerId }).eq('id', userId)
        }
      }

      await savePlayerId()
      OneSignal.User.PushSubscription.addEventListener('change', savePlayerId)
    })
  }, [userId, supabase])

  if (!APP_ID) return null

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
    />
  )
}
