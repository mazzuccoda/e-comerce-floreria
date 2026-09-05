export const TRANSFER_DATA = {
  banco: 'Mercado Pago',
  alias: 'eleososatuc',
  cvu: '0000003100095405777972',
  titular: 'Monica Eleonora Sosa',
  cuit: '27-26676582-2',
}

export const TIENDA = {
  direccion: 'Solano Vera 480, Yerba Buena, Tucumán',
  horario: '9:00 a 20:00 hs',
  whatsapp: '5493813671352',
}

export const formatARS = (monto: number) =>
  `$${Number(monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const whatsappLink = (mensaje: string) =>
  `https://wa.me/${TIENDA.whatsapp}?text=${encodeURIComponent(mensaje)}`
