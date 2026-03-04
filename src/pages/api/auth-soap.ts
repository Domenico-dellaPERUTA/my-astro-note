// src/pages/api/auth-soap.ts
import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { AuthHandler } from '../../soap/handlers/auth-handler';
import { createLoginResponse, createSoapFault } from '../../soap/templates/auth-responses';
import { parseLoginRequest } from '../../soap/parsers/auth-parser';

let wsdlCache: string | null = null;

async function getWSDL(): Promise<string> {
  if (!wsdlCache) {
    const wsdlPath = path.join(process.cwd(), 'src', 'soap', 'wsdl', 'auth-service.wsdl');
    wsdlCache = await fs.readFile(wsdlPath, 'utf-8');
  }
  return wsdlCache;
}

export const GET: APIRoute = async ({ url }) => {
  if (url.searchParams.has('wsdl')) {
    console.log('📄 Serving Auth WSDL');
    const wsdl = await getWSDL();
    
    return new Response(wsdl, {
      status: 200,
      headers: { 
        'Content-Type': 'text/xml; charset=utf-8'
      }
    });
  }
  
  return new Response('Auth SOAP Endpoint - use ?wsdl to get WSDL', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    
    console.log('📨 Auth SOAP Request received');
    
    // Parse richiesta login
    const requestData = parseLoginRequest(body);
    
    if (!requestData.username || !requestData.password || !requestData.token) {
      const faultResponse = createSoapFault(
        'Client',
        'Parametri mancanti: username, password e token sono richiesti'
      );
      return new Response(faultResponse, {
        status: 400,
        headers: { 'Content-Type': 'text/xml; charset=utf-8' }
      });
    }
    
    // Esegui login
    const result = await AuthHandler.login(requestData);
    const response = createLoginResponse(result.success, result.message);
    
    console.log(result.success ? '✅ Login successful' : '❌ Login failed');
    
    return new Response(response, {
      status: 200,
      headers: { 
        'Content-Type': 'text/xml; charset=utf-8'
      }
    });
    
  } catch (error) {
    console.error('❌ Errore nel servizio SOAP:', error);
    
    const faultResponse = createSoapFault(
      'Server',
      `Errore interno: ${error.message}`
    );
    
    return new Response(faultResponse, {
      status: 500,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' }
    });
  }
};