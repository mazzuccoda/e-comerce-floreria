'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'

interface TransferQRProps {
  pedidoId: string
  metodoPago: string
  enabled?: boolean  // Hacer que sea opcional
}

export default function TransferQROptional({ pedidoId, metodoPago, enabled = false }: TransferQRProps) {
  const [qrData, setQrData] = useState<any>(null)
  const [qrImage, setQrImage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [showQR, setShowQR] = useState(false)

  // Solo mostrar si el método de pago es transferencia Y está habilitado
  if (metodoPago !== 'transferencia' || !enabled) {
    return null
  }

  const generateQR = async () => {
    setLoading(true)
    setError('')

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
        setQrData(data)
        
        // Generar imagen QR desde la URL
        const qrCodeDataUrl = await QRCode.toDataURL(data.qr_data.qr_code_url, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        
        setQrImage(qrCodeDataUrl)
        setShowQR(true)
      } else {
        setError(data.error || 'No se pudo generar el QR')
      }
    } catch (err) {
      console.error('Error al generar QR:', err)
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 shadow-lg border border-blue-200 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900">Pago con QR (Opcional)</h3>
      </div>

      {!showQR ? (
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Prefieres pagar escaneando un código QR? Genera un QR de Mercado Pago para realizar tu transferencia de forma más rápida.
          </p>
          
          <div className="bg-white rounded-xl p-4 border border-blue-100">
            <div className="flex items-start gap-3 mb-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Pago confirmado automáticamente</p>
                <p className="text-xs text-gray-600 mt-1">No necesitas enviar comprobante</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Más rápido y seguro</p>
                <p className="text-xs text-gray-600 mt-1">Escanea y paga en segundos</p>
              </div>
            </div>
          </div>

          <button
            onClick={generateQR}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando QR...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Generar QR de Pago
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 flex flex-col items-center">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Escanea para pagar</h4>
            
            {qrImage && (
              <img 
                src={qrImage} 
                alt="QR de pago" 
                className="w-64 h-64 border-4 border-gray-200 rounded-lg shadow-lg mb-4"
              />
            )}
            
            <p className="text-center text-gray-600 mb-2">
              Escanea este código con la app de Mercado Pago o tu banco
            </p>
            
            <div className="w-full bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2 text-green-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium">El pago se confirmará automáticamente</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowQR(false)}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Ocultar QR
          </button>
        </div>
      )}
    </div>
  )
}
