// src/soap/handlers/hello-handler.ts

export interface SayHelloRequest {
  name: string;
}

export interface SayHelloResponse {
  message: string;
}

export class HelloHandler {
  static sayHello(request: SayHelloRequest): SayHelloResponse {
    console.log('📞 sayHello chiamato con:', request);
    
    const { name } = request;
    
    // Qui puoi aggiungere logica complessa, validazione, database, etc.
    const message = name 
      ? `Hello World, ${name}! 🎉`
      : 'Hello World, Guest! 🎉';
    
    return { message };
  }
}