import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    const { user, token } = await authService.registerUser(name, email, password);
    
    res.json({ token, user });
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    const { user, token } = await authService.loginUser(email, password);
    
    res.json({ token, user });
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.getUserById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
}; 