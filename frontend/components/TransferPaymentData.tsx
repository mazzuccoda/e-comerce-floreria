'use client'

import { useState, useEffect } from 'react'

interface TransferPaymentDataProps {
  total: number
  showQR?: boolean
  pedidoId?: string
}

export default function TransferPaymentData({ total, showQR = true, pedidoId }: TransferPaymentDataProps) {
  const [qrImage, setQrImage] = useState<string>('')
  const [mpQrData, setMpQrData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMpQr, setLoadingMpQr] = useState(false)
  const [copiedField, setCopiedField] = useState<string>('')
  const [showMpQr, setShowMpQr] = useState(false)

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
      // Importar dinámicamente la librería QRCode solo cuando se necesita
      const QRCode = (await import('qrcode')).default
      
      // Crear texto con datos de transferencia
      const qrText = `CVU: ${transferData.cvu}\nAlias: ${transferData.alias}\nTitular: ${transferData.titular}\nMonto: $${total.toLocaleString('es-AR')}`
      
      // Generar QR
      const qrDataUrl = await QRCode.toDataURL(qrText, {
        width: 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      setQrImage(qrDataUrl)
    } catch (err) {
      console.error('Error al generar QR:', err)
      // Si falla, simplemente no mostramos el QR
    } finally {
      setLoading(false)
    }
  }

  // Generar QR de Mercado Pago dinámico
  const generateMercadoPagoQR = async () => {
    if (!pedidoId) {
      alert('No se puede generar QR sin ID de pedido')
      return
    }

    setLoadingMpQr(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://e-comerce-floreria-production.up.railway.app'
      
      const response = await fetch(`${API_URL}/api/pedidos/${pedidoId}/generate-transfer-qr/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setMpQrData(data)
        setShowMpQr(true)
        
        // Generar imagen QR desde la URL de Mercado Pago
        const QRCode = (await import('qrcode')).default
        const qrCodeDataUrl = await QRCode.toDataURL(data.init_point, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos de transferencia */}
        <div className="space-y-3">
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
          <div className="flex flex-col bg-white p-6 rounded-lg shadow-sm border border-green-100">
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
                onClick={() => {
                  if (!showMpQr && pedidoId) {
                    generateMercadoPagoQR()
                  }
                }}
                disabled={!pedidoId || loadingMpQr}
                title={!pedidoId ? 'Disponible después de confirmar el pedido' : ''}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                  showMpQr 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {loadingMpQr ? '⏳ Generando...' : !pedidoId ? '💳 Pago directo MP 🔒' : '💳 Pago directo MP'}
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
