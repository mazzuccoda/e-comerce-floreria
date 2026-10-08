import type { Metadata } from 'next';
import ConfirmarSolicitudClient from './ConfirmarSolicitudClient';

// El link es privado y de un solo uso: no tiene que entrar al buscador.
export const metadata: Metadata = {
  title: 'Confirmar tu pedido | Florería Cristina',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function ConfirmarSolicitudPage() {
  return <ConfirmarSolicitudClient />;
}
