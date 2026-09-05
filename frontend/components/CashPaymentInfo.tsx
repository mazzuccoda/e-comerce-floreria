'use client'

import { TIENDA, formatARS, whatsappLink } from './paymentInfo'

interface CashPaymentInfoProps {
  total: number
  isPickup: boolean
}

export default function CashPaymentInfo({ total, isPickup }: CashPaymentInfoProps) {
  return (
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-xl mb-6 border-2 border-yellow-200 shadow-lg">
      <h4 className="font-semibold text-lg mb-4 flex items-center text-gray-900">
        <span className="mr-2 text-2xl">💵</span>
        {isPickup ? 'Pagás en efectivo al retirar' : 'Pagás en efectivo al recibir'}
      </h4>

      <div className="bg-white rounded-lg p-4 border border-yellow-100 mb-4">
        <p className="text-sm text-gray-600 font-medium mb-1">Monto exacto a preparar</p>
        <p className="text-2xl font-bold text-gray-900">{formatARS(total)}</p>
        <p className="text-xs text-gray-500 mt-1">
          Si necesitás cambio, avisanos por WhatsApp así lo llevamos preparado.
        </p>
      </div>

      <ul className="space-y-2 text-sm text-gray-700">
        {isPickup ? (
          <>
            <li>
              📍 Retirás en <span className="font-medium">{TIENDA.direccion}</span>
            </li>
            <li>
              🕘 En el horario que elegiste, dentro de {TIENDA.horario}
            </li>
            <li>🧾 Abonás en el local cuando retirás el arreglo</li>
          </>
        ) : (
          <>
            <li>🚚 Le abonás al repartidor cuando entrega el pedido</li>
            <li>
              🧾 El monto incluye el envío: no se cobra nada extra en la puerta
            </li>
            <li>
              📞 Si no vas a estar vos, dejanos en las instrucciones quién paga
            </li>
          </>
        )}
        <li>✅ Tu pedido queda reservado en cuanto lo confirmás, no hace falta pagar antes</li>
      </ul>

      <a
        href={whatsappLink('Hola, hice un pedido para pagar en efectivo y quiero coordinar el pago')}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Coordinar por WhatsApp
      </a>
    </div>
  )
}
