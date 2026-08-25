'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'

export function usePushNotifications() {
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Seu navegador não suporta notificações push.')
      return
    }

    if (!window.OneSignalDeferred) {
      toast.error('OneSignal ainda não carregou. Aguarde e tente novamente.')
      return
    }

    try {
      await new Promise<void>((resolve, reject) => {
        window.OneSignalDeferred!.push(async (OneSignal) => {
          try {
            const granted = await OneSignal.Notifications.requestPermission()
            if (!granted) {
              toast.error('Permissão de notificação negada.')
              reject(new Error('denied'))
              return
            }
            toast.success('Notificações push ativadas!')
            resolve()
          } catch (err) {
            reject(err)
          }
        })
      })
    } catch {
      toast.error('Erro ao ativar notificações.')
    }
  }, [])

  return { requestPermission }
}
