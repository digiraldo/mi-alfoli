'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[SW] ✅ Service Worker registrado:', reg.scope);
      }).catch((err) => {
        console.warn('[SW] Error al registrar Service Worker:', err);
      });
    }
  }, []);

  return null;
}
