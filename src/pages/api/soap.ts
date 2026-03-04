// src/pages/api/soap.ts
import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { createSayHelloResponse, createSoapFault } from '../../soap/templates/responses';
import { HelloHandler } from '../../soap/handlers/hello-handler';
import { parseSayHelloRequest, getSoapAction } from '../../soap/parser';

let wsdlCache: string | null = null;

async function getWSDL(): Promise<string> {
  if (!wsdlCache) {
    const wsdlPath = path.join(process.cwd(), 'src', 'soap', 'wsdl', 'hello-service.wsdl');
    wsdlCache = await fs.readFile(wsdlPath, 'utf-8');
  }
  return wsdlCache;
}

export const GET: APIRoute = async ({ url }) => {
  if (url.searchParams.has('wsdl')) {
    console.log('📄 Serving WSDL');
    const wsdl = await getWSDL();
    
    return new Response(wsdl, {
      status: 200,
      headers: { 
        'Content-Type': 'text/xml; charset=utf-8'
      }
    });
  }
  
  return new Response('SOAP Endpoint - use ?wsdl to get WSDL', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    const soapAction = getSoapAction(request.headers);
    
    console.log('📨 SOAP Request');
    console.log('Action:', soapAction);
    
    // Routing basato su SOAPAction
    if (soapAction === 'sayHello' || body.includes('sayHello')) {
      const requestData = parseSayHelloRequest(body);
      const result = HelloHandler.sayHello(requestData);
      const response = createSayHelloResponse(result.message);
      
      console.log('✅ Risposta inviata');
      
      return new Response(response, {
        status: 200,
        headers: { 
          'Content-Type': 'text/xml; charset=utf-8'
        }
      });
    }
    
    // Operazione non supportata
    const faultResponse = createSoapFault(
      'Client',
      'Operazione SOAP non supportata'
    );
    
    return new Response(faultResponse, {
      status: 500,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' }
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
    
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