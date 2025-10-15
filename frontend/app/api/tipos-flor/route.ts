import { NextRequest, NextResponse } from 'next/server';

// Usar URL correcta según el entorno
const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://e-comerce-floreria-production.up.railway.app')
  : 'http://localhost:8000';

export async function GET() {
  try {
    const backendUrl = `${BACKEND_URL}/api/catalogo/tipos-flor/`;
    
    console.log('🔍 Proxying tipos-flor request to:', backendUrl);
    
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
    console.log('✅ Successfully proxied tipos-flor data, count:', Array.isArray(data) ? data.length : data.results?.length || 0);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tipos-flor' },
      { status: 500 }
    );
  }
}
