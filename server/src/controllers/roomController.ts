import { Request, Response, NextFunction } from 'express';
import * as roomService from '../services/roomService';
import { prisma } from '../prisma/client';

export const createRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, isPrivate = false } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Room name is required' });
    }
    
    const room = await prisma.room.create({
      data: {
        name,
        isPrivate: Boolean(isPrivate)
      }
    });
    
    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
};

export const getRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // If user is authenticated, they can see all active rooms
    // Otherwise, only show public active rooms
    const isAuthenticated = req.user !== undefined;
    
    const rooms = await prisma.room.findMany({
      where: {
        isActive: true,
        ...(isAuthenticated ? {} : { isPrivate: false }),
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(rooms);
  } catch (error) {
    next(error);
  }
};

export const getRoomById = async (req: Request, res: Response) => {
  try {
    const room = await roomService.getRoomById(req.params.id);
    res.json(room);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
}; 