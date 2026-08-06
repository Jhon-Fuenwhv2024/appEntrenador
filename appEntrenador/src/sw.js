/* eslint-disable no-restricted-globals */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

const PUSH_DB = 'trainfit-push'
const PUSH_STORE = 'session'
const PUSH_KEY = 'pushUserId'

function isSafeActionUrl(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')
}

/** Compare pathnames only (ignore query) so ?resume=1 does not force remount. */
function pathnamesMatch(a, b, scope) {
  try {
    const left = new URL(a, scope).pathname.replace(/\/$/, '') || '/'
    const right = new URL(b, scope).pathname.replace(/\/$/, '') || '/'
    return left === right
  } catch {
    return false
  }
}

function openPushDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PUSH_DB, 1)
    request.onerror = () => reject(request.error || new Error('idb open failed'))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(PUSH_STORE)) {
        db.createObjectStore(PUSH_STORE)
      }
    }
  })
}

async function readBoundUserId() {
  try {
    const db = await openPushDb()
    const value = await new Promise((resolve, reject) => {
      const tx = db.transaction(PUSH_STORE, 'readonly')
      tx.onerror = () => reject(tx.error)
      const req = tx.objectStore(PUSH_STORE).get(PUSH_KEY)
      req.onsuccess = () => resolve(req.result)
    })
    db.close()
    const id = Number(value)
    return Number.isInteger(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let data = {
      title: 'Trainfit',
      body: 'Tienes una nueva notificación',
      actionUrl: '/',
      type: 'system',
      userId: null,
    }

    try {
      if (event.data) {
        const parsed = event.data.json()
        data = {
          ...data,
          ...parsed,
          actionUrl: isSafeActionUrl(parsed?.actionUrl) ? parsed.actionUrl : '/',
          userId: parsed?.userId != null ? Number(parsed.userId) : null,
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

    // Only show if this device is bound to the intended Trainfit user (or unbound).
    const boundUserId = await readBoundUserId()
    const targetUserId = Number.isInteger(data.userId) && data.userId > 0
      ? data.userId
      : null

    if (boundUserId && targetUserId && boundUserId !== targetUserId) {
      console.info('[sw] push suppressed: bound', boundUserId, 'target', targetUserId)
      return
    }

    // Backup: if a visible Trainfit window is open, skip noisy chat OS notifications.
    // Server usually skips chat push when presence is active; this covers races.
    if (data.type === 'chat_message') {
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      const appVisible = windowClients.some(
        (client) => client.visibilityState === 'visible',
      )
      if (appVisible) {
        console.info('[sw] chat push suppressed: app visible')
        return
      }
    }

    await self.registration.showNotification(data.title || 'Trainfit', {
      body: data.body || '',
      icon: '/pwa-192x192.png',
      badge: '/pwa-badge-96.png',
      tag: `${data.type || 'trainfit'}-${targetUserId || 'x'}`,
      renotify: true,
      data: {
        actionUrl: data.actionUrl || '/',
        type: data.type || 'system',
        userId: targetUserId,
      },
    })
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const rawUrl = event.notification?.data?.actionUrl
  const notifType = event.notification?.data?.type || 'system'
  const targetUrl = isSafeActionUrl(rawUrl) ? rawUrl : '/'
  const absoluteUrl = new URL(targetUrl, self.registration.scope).href

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      // Prefer an existing Trainfit window (same origin), then navigate/focus.
      for (const client of allClients) {
        let sameOrigin = false
        try {
          sameOrigin = new URL(client.url).origin === self.location.origin
        } catch {
          sameOrigin = false
        }
        if (!sameOrigin) continue

        if ('focus' in client) {
          await client.focus()
        }

        // Feature 088: if already on the workout player, only focus — do NOT
        // client.navigate() (that remounts Vue and starts a "new" session).
        const alreadyOnTarget = pathnamesMatch(
          client.url,
          absoluteUrl,
          self.registration.scope,
        )
        if (alreadyOnTarget) {
          try {
            client.postMessage({
              type: 'TRAINFIT_WORKOUT_FOCUS',
              reason: notifType,
              url: targetUrl,
            })
          } catch {
            // ignore
          }
          return
        }

        // iOS / older Chromium: navigate may be missing — postMessage fallback.
        if (typeof client.navigate === 'function') {
          try {
            await client.navigate(targetUrl)
            return
          } catch {
            // fall through to postMessage
          }
        }
        try {
          client.postMessage({ type: 'TRAINFIT_NAVIGATE', url: targetUrl })
        } catch {
          // ignore
        }
        return
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(absoluteUrl)
      }
    })(),
  )
})
