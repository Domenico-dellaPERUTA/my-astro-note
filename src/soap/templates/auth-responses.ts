// src/soap/templates/auth-responses.ts

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function createSoapEnvelope(content: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    ${content}
  </soap:Body>
</soap:Envelope>`;
}

export function createLoginResponse(success: boolean, message: string): string {
  const responseBody = `<loginResponse xmlns="http://example.com/auth">
  <success>${success}</success>
  <message>${escapeXml(message)}</message>
</loginResponse>`;
  
  return createSoapEnvelope(responseBody);
}

export function createSoapFault(faultCode: string, faultString: string): string {
  const faultBody = `<soap:Fault>
  <faultcode>${escapeXml(faultCode)}</faultcode>
  <faultstring>${escapeXml(faultString)}</faultstring>
</soap:Fault>`;
  
  return createSoapEnvelope(faultBody);
}