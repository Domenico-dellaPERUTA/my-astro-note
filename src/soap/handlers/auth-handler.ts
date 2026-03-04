// src/soap/handlers/auth-handler.ts
import { usersDb } from '../../db/users';

export interface LoginRequest {
  username: string;
  password: string;
  token: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
}

export class AuthHandler {
  static async login(request: LoginRequest): Promise<LoginResponse> {
    console.log('🔐 SOAP Login attempt for:', request.username);
    
    try {
      const { username, password, token } = request;
      
      // Verifica credenziali con il database (riusa la logica esistente)
      const result = await usersDb.verifyLogin(username, password, token);
      
      if (result.success) {
        console.log('✅ Login successful');
        return {
          success: true,
          message: 'Login effettuato con successo'
        };
      } else {
        console.log('❌ Login failed:', result.message);
        return {
          success: false,
          message: result.message
        };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        message: 'Errore interno del server'
      };
    }
  }
}