import { NextRequest, NextResponse } from 'next/server';

// Usar URL correcta según el entorno
const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://e-comerce-floreria-production.up.railway.app')
  : 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const backendUrl = queryString 
      ? `${BACKEND_URL}/api/catalogo/productos/?${queryString}`
      : `${BACKEND_URL}/api/catalogo/productos/`;
    
    console.log('🔍 Proxying request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Backend response not ok:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Successfully proxied products data, count:', Array.isArray(data) ? data.length : data.results?.length || 0);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
