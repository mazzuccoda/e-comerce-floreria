'use client';

import { Gift } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  GIFT_MESSAGE_MAX_LENGTH,
  readGiftDraft,
  saveGiftDraft,
} from '@/utils/giftMessage';

/**
 * "¿Es un regalo?" en la ficha: el mensaje de la tarjeta se escribe acá y el
 * checkout lo precarga en la dedicatoria.
 */
export default function GiftMessageCard() {
  const [isGift, setIsGift] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [anonimo, setAnonimo] = useState(false);

  useEffect(() => {
    const draft = readGiftDraft();
    if (!draft) return;
    if (draft.mensaje || draft.anonimo) {
      setIsGift(true);
      setMensaje(draft.mensaje);
      setAnonimo(draft.anonimo);
    }
  }, []);

  const persist = (nextMensaje: string, nextAnonimo: boolean) => {
    saveGiftDraft({ mensaje: nextMensaje, anonimo: nextAnonimo });
  };

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={isGift}
          onChange={(event) => setIsGift(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
        />
        <span className="text-sm">
          <span className="flex items-center gap-2 font-semibold text-gray-900">
            <Gift className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            ¿Es un regalo?
          </span>
          <span className="mt-0.5 block text-gray-600">
            Escribí el mensaje de la tarjeta ahora: lo escribimos a mano y lo podés editar en el checkout antes de pagar.
          </span>
        </span>
      </label>

      {isGift && (
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="gift-message" className="mb-1 block text-sm font-medium text-gray-700">
              Mensaje de la tarjeta
            </label>
            <textarea
              id="gift-message"
              rows={3}
              maxLength={GIFT_MESSAGE_MAX_LENGTH}
              value={mensaje}
              onChange={(event) => {
                setMensaje(event.target.value);
                persist(event.target.value, anonimo);
              }}
              placeholder="Feliz cumple, que tengas un día hermoso."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            <p className="mt-1 text-xs text-gray-500">
              {mensaje.length}/{GIFT_MESSAGE_MAX_LENGTH} caracteres
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={anonimo}
              onChange={(event) => {
                setAnonimo(event.target.checked);
                persist(mensaje, event.target.checked);
              }}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
            />
            <span>No revelar mi nombre al destinatario</span>
          </label>

          {mensaje.trim() && (
            <div className="rounded-md border border-dashed border-emerald-300 bg-emerald-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Así se va a leer
              </p>
              <p className="mt-2 whitespace-pre-line text-sm italic text-gray-800">“{mensaje}”</p>
              <p className="mt-2 text-xs text-gray-600">
                {anonimo ? 'Sin firma del remitente' : 'Se firma con tus datos del checkout'}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Lo vas a ver precargado en el paso “Tus datos y dedicatoria”.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
