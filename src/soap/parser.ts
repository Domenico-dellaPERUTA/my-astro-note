// src/soap/parser.ts

export function parseSayHelloRequest(soapBody: string): { name: string } {
  const nameMatch = soapBody.match(/<(?:.*:)?name>(.+?)<\/(?:.*:)?name>/);
  const name = nameMatch ? nameMatch[1] : 'Guest';
  
  return { name };
}

export function getSoapAction(headers: Headers): string | null {
  return headers.get('SOAPAction')?.replace(/"/g, '') || null;
}