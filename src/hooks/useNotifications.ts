'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      // Verificar si ya está suscrito
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsEnabled(!!sub);
        });
      });
    }
  }, []);

  const enable = useCallback(async () => {
    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Debes permitir notificaciones para activar esta función.');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
      const rawKey = urlBase64ToUint8Array(vapidKey);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: rawKey.buffer.slice(rawKey.byteOffset, rawKey.byteOffset + rawKey.byteLength) as ArrayBuffer,
      });

      const subJson = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await api.post('/api/notifications/subscribe', {
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      });

      setIsEnabled(true);
    } catch (err) {
      console.error('[PushNotifications] Error al activar:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.delete('/api/notifications/subscribe', { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setIsEnabled(false);
    } catch (err) {
      console.error('[PushNotifications] Error al desactivar:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggle = useCallback(async () => {
    if (isEnabled) {
      await disable();
    } else {
      await enable();
    }
  }, [isEnabled, enable, disable]);

  const sendTest = useCallback(async () => {
    try {
      await api.post('/api/notifications/test', {});
      alert('¡Notificación de prueba enviada! Debería aparecer pronto.');
    } catch {
      alert('Error al enviar la notificación de prueba.');
    }
  }, []);

  return { isSupported, isEnabled, isLoading, toggle, sendTest };
}
