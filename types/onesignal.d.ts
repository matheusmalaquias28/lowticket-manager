interface OneSignalSDK {
  init: (options: { appId: string; allowLocalhostAsSecureOrigin?: boolean }) => Promise<void>
  Notifications: {
    requestPermission: () => Promise<boolean>
  }
  User: {
    PushSubscription: {
      id?: string | null
      addEventListener: (event: 'change', handler: () => void) => void
    }
  }
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalSDK) => void | Promise<void>>
  }
}

export {}
