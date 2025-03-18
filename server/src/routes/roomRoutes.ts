import express from 'express';
import { createRoom, getRooms, getRoomById } from '../controllers/roomController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getRooms);
router.get('/:id', getRoomById);

// Protected routes
router.post('/', createRoom);

export default router; 