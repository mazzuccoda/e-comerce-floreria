import React from 'react';

export const metadata = {
  title: 'Términos y Condiciones - Florería Cristina',
  description: 'Términos y condiciones de uso y compra en Florería Cristina',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 md:p-12">
        <h1 className="text-4xl font-bold text-green-800 border-b-4 border-green-400 pb-4 mb-6">
          Términos y Condiciones
        </h1>
        
        <p className="text-gray-600 italic mb-8">
          <strong>Última actualización:</strong> Febrero 2026
        </p>
        
        <p className="mb-6 text-gray-700 leading-relaxed">
          Bienvenido a <strong>Florería Cristina</strong>. Al utilizar nuestro sitio web y realizar un pedido, usted acepta los siguientes términos y condiciones. Por favor, léalos detenidamente.
        </p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">1. Aceptación de Términos</h2>
          <p className="text-gray-700">
            Al acceder y utilizar este sitio web, usted acepta estar sujeto a estos términos y condiciones, todas las leyes y regulaciones aplicables, y acepta que es responsable del cumplimiento de las leyes locales aplicables.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">2. Sobre Nuestros Servicios</h2>
          <p className="mb-3 text-gray-700"><strong>Florería Cristina</strong> ofrece:</p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Venta de flores frescas, plantas y arreglos florales</li>
            <li>Servicio de entrega a domicilio en San Miguel de Tucumán y zonas aledañas</li>
            <li>Personalización de arreglos florales</li>
            <li>Servicio de dedicatorias y tarjetas personalizadas</li>
            <li>Opción de entrega programada o express</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">3. Productos y Disponibilidad</h2>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Todos los productos están sujetos a disponibilidad de stock</li>
            <li>Las imágenes son referenciales; los productos pueden variar ligeramente debido a la naturaleza de las flores frescas</li>
            <li>Nos reservamos el derecho de sustituir flores por otras de igual o mayor valor si no están disponibles</li>
            <li>Los colores y tamaños pueden variar según la temporada y disponibilidad</li>
          </ul>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4 rounded-r">
            <p className="text-gray-700">
              <strong>Nota Importante:</strong> Las flores son productos naturales y perecederos. Su apariencia puede variar según la estación y disponibilidad del mercado.
            </p>
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">4. Precios y Pagos</h2>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Todos los precios están expresados en <strong>pesos argentinos (ARS)</strong></li>
            <li>Los precios incluyen IVA cuando corresponda</li>
            <li>Los costos de envío se calculan según la zona de entrega</li>
            <li>Aceptamos pagos a través de <strong>Mercado Pago</strong> (tarjetas de crédito, débito, transferencias)</li>
            <li>Los precios pueden variar sin previo aviso</li>
            <li>El pedido se confirma una vez aprobado el pago</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">5. Proceso de Compra</h2>
          <ol className="list-decimal ml-6 space-y-2 text-gray-700">
            <li>Seleccione los productos y agréguelos al carrito</li>
            <li>Complete los datos del comprador y destinatario</li>
            <li>Seleccione fecha y horario de entrega</li>
            <li>Agregue dedicatoria (opcional)</li>
            <li>Proceda al pago a través de Mercado Pago</li>
            <li>Recibirá confirmación por email y WhatsApp</li>
          </ol>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">6. Entregas</h2>
          
          <h3 className="text-xl font-semibold text-green-600 mb-3 mt-4">6.1 Zonas de Entrega</h3>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li><strong>Yerba Buena:</strong> 0-5 km del centro</li>
            <li><strong>San Miguel Centro:</strong> 5-8 km</li>
            <li><strong>San Miguel Extendido:</strong> 8-15 km</li>
          </ul>
          
          <h3 className="text-xl font-semibold text-green-600 mb-3 mt-4">6.2 Horarios de Entrega</h3>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li><strong>Entrega Express:</strong> Mismo día (sujeto a disponibilidad y horario de pedido)</li>
            <li><strong>Entrega Programada:</strong> Fecha y franja horaria seleccionada</li>
            <li><strong>Retiro en local:</strong> Sin costo adicional</li>
          </ul>
          
          <h3 className="text-xl font-semibold text-green-600 mb-3 mt-4">6.3 Condiciones de Entrega</h3>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Las entregas se realizan en días hábiles de 9:00 a 20:00 hs</li>
            <li>Es necesario que haya alguien en el domicilio para recibir el pedido</li>
            <li>Si el destinatario no se encuentra, se intentará contacto telefónico</li>
            <li>En caso de no poder entregar, se coordinará nueva entrega (puede tener costo adicional)</li>
            <li>No nos hacemos responsables por direcciones incorrectas o incompletas</li>
          </ul>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4 rounded-r">
            <p className="text-gray-700">
              <strong>Entregas Especiales:</strong> Para fechas especiales (San Valentín, Día de la Madre, etc.) recomendamos realizar pedidos con anticipación. Los tiempos de entrega pueden extenderse.
            </p>
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">7. Cancelaciones y Modificaciones</h2>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Puede cancelar o modificar su pedido hasta <strong>2 horas antes</strong> de la entrega programada</li>
            <li>Para cancelaciones, contacte a nuestro servicio al cliente</li>
            <li>Las cancelaciones después del plazo establecido no tendrán reembolso</li>
            <li>Los reembolsos se procesan en 5-10 días hábiles según el medio de pago</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">8. Devoluciones y Reclamos</h2>
          <p className="mb-3 text-gray-700">Debido a la naturaleza perecedera de nuestros productos:</p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li><strong>No aceptamos devoluciones</strong> una vez entregado el pedido</li>
            <li>Si el producto llega en mal estado o no cumple con lo solicitado, contáctenos <strong>dentro de las 24 horas</strong></li>
            <li>Evaluaremos cada caso y ofreceremos una solución (reemplazo o reembolso)</li>
            <li>Se requieren fotos del producto para procesar reclamos</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">9. Limitación de Responsabilidad</h2>
          <p className="mb-3 text-gray-700">No nos hacemos responsables por:</p>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Demoras causadas por eventos de fuerza mayor (clima extremo, cortes de ruta, etc.)</li>
            <li>Direcciones incorrectas o incompletas proporcionadas por el cliente</li>
            <li>Rechazo del pedido por parte del destinatario</li>
            <li>Daños causados por terceros después de la entrega</li>
            <li>Variaciones naturales en el color y tamaño de las flores</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">10. Privacidad y Protección de Datos</h2>
          <p className="text-gray-700">
            El uso de sus datos personales está regido por nuestra{' '}
            <a href="/privacidad" className="text-green-600 hover:underline font-semibold">
              Política de Privacidad
            </a>
            . Al utilizar nuestros servicios, acepta el tratamiento de sus datos según dicha política.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">11. Ley de Defensa del Consumidor</h2>
          <p className="text-gray-700">
            Este contrato se rige por la Ley N° 24.240 de Defensa del Consumidor. Para consultas o reclamos, puede contactar a la Dirección de Defensa del Consumidor de su jurisdicción.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">12. Modificaciones a los Términos</h2>
          <p className="text-gray-700">
            Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en el sitio web.
          </p>
        </section>
        
        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg mt-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">Contacto y Atención al Cliente</h2>
          <p className="text-gray-700 mb-3">Para consultas, pedidos o reclamos:</p>
          <div className="text-gray-700 space-y-1">
            <p><strong>Email:</strong> <a href="mailto:info@floreriacristina.com" className="text-green-600 hover:underline">info@floreriacristina.com</a></p>
            <p><strong>WhatsApp:</strong> +54 381 477-8577</p>
            <p><strong>Horario de atención:</strong> Lunes a Sábado de 9:00 a 20:00 hs</p>
            <p><strong>Dirección:</strong> San Miguel de Tucumán, Argentina</p>
            <p className="mt-3"><strong>Reclamos:</strong> <a href="mailto:reclamos@floreriacristina.com" className="text-green-600 hover:underline">reclamos@floreriacristina.com</a></p>
          </div>
        </div>
        
        <p className="mt-8 text-center text-gray-500 text-sm">
          © 2026 Florería Cristina. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
