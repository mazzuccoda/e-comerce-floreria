"""URLs de imágenes optimizadas para feeds y consumidores externos."""

CLOUDINARY_UPLOAD_MARKER = '/image/upload/'

# Google Merchant Center y Meta recomiendan imágenes de ~1200 px: las originales
# de Cloudinary pesan hasta 2,5 MB y frenan el crawl.
FEED_IMAGE_TRANSFORMATION = 'f_auto,q_auto,w_1200'


def feed_image_url(url, transformation=FEED_IMAGE_TRANSFORMATION):
    """Inserta la transformación de Cloudinary; deja intactas otras URLs."""
    if not url:
        return ''
    marker_index = url.find(CLOUDINARY_UPLOAD_MARKER)
    if marker_index == -1:
        return url
    corte = marker_index + len(CLOUDINARY_UPLOAD_MARKER)
    return '{}{}/{}'.format(url[:corte], transformation, url[corte:])
