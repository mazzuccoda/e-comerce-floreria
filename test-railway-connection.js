#!/usr/bin/env node

/**
 * Script de diagnóstico para Railway
 * Verifica la conectividad entre Frontend y Backend
 */

const https = require('https');

const BACKEND_URL = 'https://e-comerce-floreria-production.up.railway.app';
const FRONTEND_URL = 'https://frontend-production-0b0b.up.railway.app';

console.log('\n🔍 DIAGNÓSTICO DE RAILWAY\n');
console.log('=' .repeat(60));

// Test 1: Backend API directa
async function testBackendDirect() {
  console.log('\n📡 Test 1: Backend API (Directo)');
  console.log(`URL: ${BACKEND_URL}/api/carrito/simple/\n`);
  
  return new Promise((resolve) => {
    const req = https.get(`${BACKEND_URL}/api/carrito/simple/`, (res) => {
      let data = '';
      
      console.log(`✅ Status Code: ${res.statusCode}`);
      console.log(`✅ Headers:`);
      console.log(`   - Content-Type: ${res.headers['content-type']}`);
      console.log(`   - Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'NO CONFIGURADO'}`);
      
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ Response: ${JSON.stringify(json, null, 2)}`);
          resolve({ success: true, data: json });
        } catch (e) {
          console.log(`❌ Invalid JSON: ${data.substring(0, 200)}`);
          resolve({ success: false, error: 'Invalid JSON' });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    req.end();
  });
}

// Test 2: Backend productos
async function testBackendProductos() {
  console.log('\n📦 Test 2: Backend API (Productos)');
  console.log(`URL: ${BACKEND_URL}/api/catalogo/productos/\n`);
  
  return new Promise((resolve) => {
    const req = https.get(`${BACKEND_URL}/api/catalogo/productos/`, (res) => {
      let data = '';
      
      console.log(`✅ Status Code: ${res.statusCode}`);
      
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ Productos encontrados: ${json.length || 0}`);
          if (json.length > 0) {
            console.log(`✅ Primer producto: ${json[0].nombre || 'N/A'}`);
          }
          resolve({ success: true, count: json.length });
        } catch (e) {
          console.log(`❌ Invalid JSON`);
          resolve({ success: false, error: 'Invalid JSON' });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    req.end();
  });
}

// Test 3: Frontend responde
async function testFrontendAlive() {
  console.log('\n🌐 Test 3: Frontend (Disponibilidad)');
  console.log(`URL: ${FRONTEND_URL}/\n`);
  
  return new Promise((resolve) => {
    const req = https.get(`${FRONTEND_URL}/`, (res) => {
      console.log(`✅ Status Code: ${res.statusCode}`);
      console.log(`✅ Content-Type: ${res.headers['content-type']}`);
      
      if (res.statusCode === 200) {
        console.log(`✅ Frontend está respondiendo correctamente`);
        resolve({ success: true });
      } else {
        console.log(`⚠️ Frontend responde pero con código ${res.statusCode}`);
        resolve({ success: false, code: res.statusCode });
      }
      
      res.resume(); // Descartar el body
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    req.end();
  });
}

// Test 4: Frontend API rewrites
async function testFrontendRewrites() {
  console.log('\n🔄 Test 4: Frontend API Rewrites');
  console.log(`URL: ${FRONTEND_URL}/api/carrito/simple/\n`);
  
  return new Promise((resolve) => {
    const req = https.get(`${FRONTEND_URL}/api/carrito/simple/`, (res) => {
      let data = '';
      
      console.log(`✅ Status Code: ${res.statusCode}`);
      
      if (res.statusCode === 404) {
        console.log(`❌ 404: Rewrites NO están funcionando`);
        console.log(`❌ El frontend NO está proxying a /api/* correctamente`);
        resolve({ success: false, error: 'Rewrites not working' });
        res.resume();
        return;
      }
      
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ Rewrites funcionan: ${JSON.stringify(json, null, 2)}`);
          resolve({ success: true, data: json });
        } catch (e) {
          console.log(`⚠️ Response OK pero no es JSON`);
          resolve({ success: true });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    req.end();
  });
}

// Ejecutar todos los tests
(async () => {
  const results = [];
  
  results.push(await testBackendDirect());
  results.push(await testBackendProductos());
  results.push(await testFrontendAlive());
  results.push(await testFrontendRewrites());
  
  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN\n');
  
  const allSuccess = results.every(r => r.success);
  
  if (allSuccess) {
    console.log('✅ ¡Todos los tests pasaron!');
    console.log('✅ Frontend y Backend están comunicándose correctamente');
  } else {
    console.log('❌ Algunos tests fallaron:');
    results.forEach((r, i) => {
      if (!r.success) {
        console.log(`   Test ${i + 1}: ❌ ${r.error || 'Failed'}`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
})();
