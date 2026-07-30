/* eslint-disable no-restricted-globals */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

function isSafeActionUrl(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')
}

self.addEventListener('push', (event) => {
  let data = {
    title: 'Trainfit',
    body: 'Tienes una nueva notificación',
    actionUrl: '/',
    type: 'system',
  }

  try {
    if (event.data) {
      const parsed = event.data.json()
      data = {
        ...data,
        ...parsed,
        actionUrl: isSafeActionUrl(parsed?.actionUrl) ? parsed.actionUrl : '/',
      }
    }
  } catch {
    try {
      const text = event.data?.text()
      if (text) data.body = text
    } catch {
      // keep defaults
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Trainfit', {
      body: data.body || '',
      icon: '/pwa-192x192.png',
      badge: '/pwa-badge-96.png',
      tag: data.type || 'trainfit',
      renotify: true,
      data: {
        actionUrl: data.actionUrl || '/',
        type: data.type || 'system',
      },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const rawUrl = event.notification?.data?.actionUrl
  const targetUrl = isSafeActionUrl(rawUrl) ? rawUrl : '/'

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus()
          if ('navigate' in client) {
            await client.navigate(targetUrl)
          }
          return
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl)
      }
    })(),
  )
})
