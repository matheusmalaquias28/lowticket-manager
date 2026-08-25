const ONESIGNAL_APP_ID =
  process.env.ONESIGNAL_APP_ID ?? process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY!

export async function sendPushNotification({
  playerIds,
  title,
  message,
  url,
}: {
  playerIds: string[]
  title: string
  message: string
  url?: string
}) {
  if (!playerIds.length) return

  const body: Record<string, unknown> = {
    app_id: ONESIGNAL_APP_ID,
    include_player_ids: playerIds,
    headings: { pt: title, en: title },
    contents: { pt: message, en: message },
  }

  if (url) body.url = url

  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  return res.json()
}
