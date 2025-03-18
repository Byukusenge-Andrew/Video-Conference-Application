import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: any;
}

export interface Message {
  text: string;
  sender: string;
  senderId: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
} 