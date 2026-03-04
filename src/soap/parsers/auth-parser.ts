// src/soap/parsers/auth-parser.ts

export function parseLoginRequest(soapBody: string): { 
  username: string; 
  password: string; 
  token: string;
} {
  const usernameMatch = soapBody.match(/<(?:.*:)?username>(.+?)<\/(?:.*:)?username>/);
  const passwordMatch = soapBody.match(/<(?:.*:)?password>(.+?)<\/(?:.*:)?password>/);
  const tokenMatch = soapBody.match(/<(?:.*:)?token>(.+?)<\/(?:.*:)?token>/);
  
  return {
    username: usernameMatch ? usernameMatch[1] : '',
    password: passwordMatch ? passwordMatch[1] : '',
    token: tokenMatch ? tokenMatch[1] : ''
  };
}