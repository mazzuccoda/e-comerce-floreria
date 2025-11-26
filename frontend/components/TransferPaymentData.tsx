'use client'

import { useState, useEffect } from 'react'

interface TransferPaymentDataProps {
  total: number
  showQR?: boolean
  pedidoId?: string
  onCreateOrder?: () => Promise<string | null> // Callback para crear pedido, retorna pedidoId
}

export default function TransferPaymentData({ total, showQR = true, pedidoId, onCreateOrder }: TransferPaymentDataProps) {
  const [qrImage, setQrImage] = useState<string>('')
  const [mpQrData, setMpQrData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMpQr, setLoadingMpQr] = useState(false)
  const [copiedField, setCopiedField] = useState<string>('')
  const [showMpQr, setShowMpQr] = useState(false)
  const [createdPedidoId, setCreatedPedidoId] = useState<string | null>(null)

  // Datos de transferencia
  const transferData = {
    banco: 'Mercado Pago',
    alias: 'eleososatuc',
    cvu: '0000003100095405777972',
    titular: 'Monica Eleonora Sosa',
    cuit: '27-26676582-2'
  }

  // Generar QR simple con los datos de transferencia
  useEffect(() => {
    if (showQR && !showMpQr) {
      generateSimpleQR()
    }
  }, [showQR, total, showMpQr])

  const generateSimpleQR = async () => {
    setLoading(true)
    try {
      // Crear texto con datos de transferencia
      const qrText = `CVU: ${transferData.cvu}\nAlias: ${transferData.alias}\nTitular: ${transferData.titular}\nMonto: $${total.toLocaleString('es-AR')}`
      
      // Usar API pública de QR Code (fallback si qrcode no está instalado)
      const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`
      
      setQrImage(qrDataUrl)
    } catch (err) {
      console.error('Error al generar QR:', err)
      // Si falla, simplemente no mostramos el QR
    } finally {
      setLoading(false)
    }
  }

  // Crear pedido y generar QR de Mercado Pago
  const createOrderAndGenerateQR = async () => {
    if (!onCreateOrder) {
      alert('No se puede crear el pedido')
      return
    }

    setLoadingMpQr(true)
    try {
      // 1. Crear el pedido
      const newPedidoId = await onCreateOrder()
      
      if (!newPedidoId) {
        alert('Error al crear el pedido')
        setLoadingMpQr(false)
        return
      }

      setCreatedPedidoId(newPedidoId)

      // 2. Generar QR de Mercado Pago con el nuevo pedidoId
      await generateMercadoPagoQRWithId(newPedidoId)
    } catch (err) {
      console.error('Error al crear pedido:', err)
      alert('Error al crear el pedido')
      setLoadingMpQr(false)
    }
  }

  // Generar QR de Mercado Pago dinámico
  const generateMercadoPagoQR = async () => {
    const idToUse = createdPedidoId || pedidoId
    
    if (!idToUse) {
      alert('No se puede generar QR sin ID de pedido')
      return
    }

    setLoadingMpQr(true)
    await generateMercadoPagoQRWithId(idToUse)
  }

  // Función auxiliar para generar QR con un pedidoId específico
  const generateMercadoPagoQRWithId = async (id: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app'
      
      const response = await fetch(`${API_URL}/api/pedidos/${id}/generate-transfer-qr/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setMpQrData(data)
        setShowMpQr(true)
        
        // Generar imagen QR desde la URL de Mercado Pago usando API pública
        const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.init_point)}`
        
        setQrImage(qrCodeDataUrl)
      } else {
        alert(data.error || 'No se pudo generar el QR de Mercado Pago')
      }
    } catch (err) {
      console.error('Error al generar QR de MP:', err)
      alert('Error al conectar con el servidor')
    } finally {
      setLoadingMpQr(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl mb-6 border-2 border-green-200 shadow-lg">
      <h4 className="font-semibold text-lg mb-4 flex items-center text-gray-900">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mr-2 text-green-600">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Datos para transferencia
      </h4>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Datos de transferencia */}
        <div className="flex-1 space-y-3">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Alias</p>
              <button
                onClick={() => copyToClipboard(transferData.alias, 'alias')}
                className="text-green-600 hover:text-green-700 text-xs font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50 transition-colors"
              >
                {copiedField === 'alias' ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copiado
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar
                  </>
                )}
              </button>
            </div>
            <p className="text-lg font-bold text-gray-900">{transferData.alias}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">CVU</p>
              <button
                onClick={() => copyToClipboard(transferData.cvu, 'cvu')}
                className="text-green-600 hover:text-green-700 text-xs font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50 transition-colors"
              >
                {copiedField === 'cvu' ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copiado
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar
                  </>
                )}
              </button>
            </div>
            <p className="text-sm font-mono font-semibold text-gray-900 break-all">{transferData.cvu}</p>
          </div>

          <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100 space-y-1">
            <p className="text-xs text-gray-600"><span className="font-medium">Banco:</span> {transferData.banco}</p>
            <p className="text-xs text-gray-600"><span className="font-medium">Titular:</span> {transferData.titular}</p>
            <p className="text-xs text-gray-600"><span className="font-medium">CUIT:</span> {transferData.cuit}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-sm text-blue-800 font-semibold mb-1">💰 Monto a transferir:</p>
            <p className="text-2xl font-bold text-blue-900">${total.toLocaleString('es-AR')}</p>
          </div>
        </div>

        {/* QR Code - Opciones */}
        {showQR && (
          <div className="flex-1 flex flex-col bg-white p-6 rounded-lg shadow-sm border border-green-100">
            {/* Tabs para elegir tipo de QR */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setShowMpQr(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                  !showMpQr 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📋 Datos manuales
              </button>
              <button
                onClick={() => setShowMpQr(true)}
                disabled={loadingMpQr}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                  showMpQr 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {loadingMpQr ? '⏳ Generando...' : '💳 Pago directo MP'}
              </button>
            </div>

            {/* Contenido del QR */}
            <div className="flex flex-col items-center justify-center">
              {(loading || loadingMpQr) ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <svg className="animate-spin h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm text-gray-600">Generando QR...</p>
                </div>
              ) : showMpQr && !qrImage && !pedidoId && onCreateOrder ? (
                // Mostrar botón para crear pedido y generar QR
                <div className="w-full space-y-4 py-4">
                  <button
                    onClick={createOrderAndGenerateQR}
                    disabled={loadingMpQr}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    🚀 Generar QR de Mercado Pago
                  </button>
                  
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Importante:</p>
                    <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                      <li>Al hacer click se confirmará tu pedido</li>
                      <li>Se generará un QR para pagar con Mercado Pago</li>
                      <li>No cierres esta página hasta completar el pago</li>
                    </ul>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">¿Prefieres coordinar el pago?</p>
                    <a
                      href="https://wa.me/5493813671352?text=Hola,%20quiero%20coordinar%20el%20pago%20de%20mi%20pedido"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Contactar por WhatsApp
                    </a>
                  </div>
                </div>
              ) : qrImage ? (
                <>
                  <h5 className="text-sm font-semibold text-gray-900 mb-3 text-center">
                    {showMpQr ? '💳 Escanea para pagar con Mercado Pago' : '📋 Escanea para copiar datos'}
                  </h5>
                  <img 
                    src={qrImage} 
                    alt={showMpQr ? "QR de pago Mercado Pago" : "QR con datos de transferencia"} 
                    className="w-64 h-64 border-4 border-gray-200 rounded-lg shadow-md"
                  />
                  <p className="text-xs text-gray-600 mt-3 text-center max-w-xs">
                    {showMpQr 
                      ? '✅ Paga directamente con Mercado Pago o tu banco. Confirmación automática.'
                      : 'Escanea con tu app bancaria para copiar los datos automáticamente'
                    }
                  </p>
                  {showMpQr && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 w-full">
                      <p className="text-xs text-blue-800 text-center">
                        <strong>✨ Ventaja:</strong> No necesitas enviar comprobante, el pago se confirma solo
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500 text-sm py-8">
                  <svg className="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <p>QR no disponible</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!showMpQr && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            <strong>⚠️ Importante:</strong> Después de realizar la transferencia, envíanos el comprobante por WhatsApp para confirmar tu pedido.
          </p>
        </div>
      )}
    </div>
  )
}
