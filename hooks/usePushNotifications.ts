'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function usePushNotifications() {
  const supabase = createClient()

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Seu navegador não suporta notificações push.')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('Permissão de notificação negada.')
        return
      }

      // OneSignal initialization handled in the layout
      toast.success('Notificações push ativadas!')
    } catch {
      toast.error('Erro ao ativar notificações.')
    }
  }, [])

  const savePlayerId = useCallback(async (userId: string, playerId: string) => {
    await supabase.from('profiles').update({ onesignal_player_id: playerId }).eq('id', userId)
  }, [supabase])

  return { requestPermission, savePlayerId }
}
