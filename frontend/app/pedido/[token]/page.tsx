'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package, Calendar, MapPin, User, Phone, Mail, CreditCard, Truck, CheckCircle } from 'lucide-react';

interface PedidoItem {
  id: number;
  producto: {
    id: number;
    nombre: string;
    precio: string;
  };
  cantidad: number;
  precio: string;
}

interface Pedido {
  id: number;
  numero_pedido: string;
  estado: string;
  estado_display: string;
  estado_pago: string;
  estado_pago_display: string;
  nombre_comprador: string;
  email_comprador: string;
  telefono_comprador: string;
  nombre_destinatario: string;
  telefono_destinatario: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  fecha_entrega: string;
  franja_horaria: string;
  franja_horaria_display: string;
  tipo_envio: string;
  tipo_envio_display: string;
  medio_pago: string;
  medio_pago_display: string;
  dedicatoria: string;
  firmado_como: string;
  instrucciones: string;
  costo_envio: string;
  total: string;
  creado: string;
  items: PedidoItem[];
}

export default function PedidoByTokenPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchPedido = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/pedidos/token/${token}/`
        );

        if (!response.ok) {
          throw new Error('Pedido no encontrado');
        }

        const data = await response.json();
        setPedido(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchPedido();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Pedido no encontrado</h1>
          <p className="text-gray-600 mb-6">{error || 'El link puede ser inválido o haber expirado'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'entregado':
        return 'bg-green-100 text-green-800';
      case 'en_camino':
        return 'bg-blue-100 text-blue-800';
      case 'preparando':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoPagoBadgeColor = (estadoPago: string) => {
    switch (estadoPago) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🌸 Florería Cristina
              </h1>
              <p className="text-gray-600">Pedido #{pedido.numero_pedido}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getEstadoBadgeColor(pedido.estado)}`}>
                {pedido.estado_display}
              </span>
            </div>
          </div>

          {pedido.estado === 'entregado' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 mb-2">¡Tu pedido ha sido entregado!</h3>
                  <p className="text-green-700 text-sm mb-3">
                    Esperamos que hayas disfrutado tu compra. Tu opinión es muy importante para nosotros.
                  </p>
                  <a
                    href="https://g.page/r/CdV9BtKF_KgNEBM/review"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
                  >
                    ⭐ Valorar en Google
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Productos */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Productos
          </h2>
          <div className="space-y-3">
            {pedido.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b border-gray-200 pb-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.producto.nombre}</p>
                  <p className="text-sm text-gray-600">Cantidad: {item.cantidad}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">${parseFloat(item.precio).toLocaleString('es-AR')}</p>
                  <p className="text-sm text-gray-600">${parseFloat(item.producto.precio).toLocaleString('es-AR')} c/u</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${(parseFloat(pedido.total) - parseFloat(pedido.costo_envio)).toLocaleString('es-AR')}</span>
            </div>
            {parseFloat(pedido.costo_envio) > 0 && (
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Envío:</span>
                <span className="font-medium">${parseFloat(pedido.costo_envio).toLocaleString('es-AR')}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span>${parseFloat(pedido.total).toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>

        {/* Detalles de Entrega */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Truck className="w-5 h-5 mr-2" />
            Detalles de Entrega
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Fecha de entrega</p>
                <p className="font-medium text-gray-800">{new Date(pedido.fecha_entrega).toLocaleDateString('es-AR')}</p>
                <p className="text-sm text-gray-600">{pedido.franja_horaria_display}</p>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Dirección</p>
                <p className="font-medium text-gray-800">{pedido.direccion}</p>
                {pedido.ciudad && <p className="text-sm text-gray-600">{pedido.ciudad}, {pedido.codigo_postal}</p>}
              </div>
            </div>
            <div className="flex items-start">
              <User className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Destinatario</p>
                <p className="font-medium text-gray-800">{pedido.nombre_destinatario}</p>
                <p className="text-sm text-gray-600">{pedido.telefono_destinatario}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Package className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Tipo de envío</p>
                <p className="font-medium text-gray-800">{pedido.tipo_envio_display || 'No especificado'}</p>
              </div>
            </div>
          </div>

          {pedido.dedicatoria && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Dedicatoria</p>
              <p className="text-gray-800 italic">"{pedido.dedicatoria}"</p>
              {pedido.firmado_como && (
                <p className="text-sm text-gray-600 mt-1">- {pedido.firmado_como}</p>
              )}
            </div>
          )}

          {pedido.instrucciones && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Instrucciones especiales</p>
              <p className="text-gray-800">{pedido.instrucciones}</p>
            </div>
          )}
        </div>

        {/* Información de Pago */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Información de Pago
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Método de pago</p>
              <p className="font-medium text-gray-800">{pedido.medio_pago_display}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado del pago</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getEstadoPagoBadgeColor(pedido.estado_pago)}`}>
                {pedido.estado_pago_display}
              </span>
            </div>
          </div>

          {pedido.estado_pago === 'pendiente' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Pago pendiente:</strong> Tu pedido está confirmado pero aún no hemos recibido el pago. 
                Si elegiste transferencia bancaria, por favor realizá la transferencia a la brevedad.
              </p>
            </div>
          )}
        </div>

        {/* Información del Comprador */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Información del Comprador
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <User className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="font-medium text-gray-800">{pedido.nombre_comprador}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-800">{pedido.email_comprador}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium text-gray-800">{pedido.telefono_comprador}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Fecha del pedido</p>
                <p className="font-medium text-gray-800">{new Date(pedido.creado).toLocaleDateString('es-AR')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <p className="text-gray-600 mb-4">
            ¿Necesitás ayuda con tu pedido? Contactanos
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/5491234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
            >
              📱 WhatsApp
            </a>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              🏠 Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
