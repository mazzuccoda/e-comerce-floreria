export interface GiftDraft {
  mensaje: string;
  anonimo: boolean;
}

const STORAGE_KEY = 'gift_draft';

export const GIFT_MESSAGE_MAX_LENGTH = 200;

/**
 * Borrador de la tarjeta del regalo: se escribe en la ficha del producto y el
 * checkout lo usa para precargar la dedicatoria.
 */
export function readGiftDraft(): GiftDraft | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const draft = parsed as Partial<GiftDraft>;
    return {
      mensaje: typeof draft.mensaje === 'string' ? draft.mensaje.slice(0, GIFT_MESSAGE_MAX_LENGTH) : '',
      anonimo: draft.anonimo === true,
    };
  } catch {
    return null;
  }
}

export function saveGiftDraft(draft: GiftDraft): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Sin localStorage el cliente escribe la dedicatoria en el checkout
  }
}

export function clearGiftDraft(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nada que limpiar
  }
}
