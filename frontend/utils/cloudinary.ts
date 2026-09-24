const CLOUDINARY_UPLOAD_MARKER = '/image/upload/';

interface ThumbOptions {
  width?: number;
  aspectRatio?: string;
}

/**
 * Normaliza el encuadre de una imagen de Cloudinary: recorte con foco automático,
 * relación de aspecto fija y formato/calidad optimizados.
 * Las URLs que no son de Cloudinary se devuelven sin cambios.
 */
export function cloudinaryThumb(url: string | null | undefined, options: ThumbOptions = {}): string {
  if (!url) return '';

  const markerIndex = url.indexOf(CLOUDINARY_UPLOAD_MARKER);
  if (markerIndex === -1) return url;

  const { width = 600, aspectRatio = '4:3' } = options;
  const transformation = `c_fill,g_auto,ar_${aspectRatio},w_${width},q_auto,f_auto`;
  const prefix = url.slice(0, markerIndex + CLOUDINARY_UPLOAD_MARKER.length);
  const rest = url.slice(markerIndex + CLOUDINARY_UPLOAD_MARKER.length);

  return `${prefix}${transformation}/${rest}`;
}

/**
 * Misma imagen, sin recortar: sólo limita el ancho y deja que Cloudinary elija
 * formato y calidad. Para la ficha y el modal, donde importa ver el ramo entero.
 */
export function cloudinaryScaled(url: string | null | undefined, width = 1000): string {
  if (!url) return '';

  const markerIndex = url.indexOf(CLOUDINARY_UPLOAD_MARKER);
  if (markerIndex === -1) return url;

  const transformation = `c_limit,w_${width},q_auto,f_auto`;
  const prefix = url.slice(0, markerIndex + CLOUDINARY_UPLOAD_MARKER.length);
  const rest = url.slice(markerIndex + CLOUDINARY_UPLOAD_MARKER.length);

  return `${prefix}${transformation}/${rest}`;
}
