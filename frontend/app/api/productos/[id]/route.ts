import { NextRequest, NextResponse } from 'next/server';

// Usar URL correcta según el entorno
const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://e-comerce-floreria-production.up.railway.app')
  : 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const backendUrl = `${BACKEND_URL}/api/catalogo/productos/${id}/`;
    
    console.log('🔍 Fetching product:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Product not found:', response.status);
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const data = await response.json();
    console.log('✅ Product fetched:', data.nombre);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error fetching product:', error);
    return NextResponse.json(
      { error: 'Error al cargar el producto' },
      { status: 500 }
    );
  }
}
