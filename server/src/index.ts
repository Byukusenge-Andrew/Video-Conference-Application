import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import { errorHandler } from './middleware/errorHandler';
import { setupSocketHandlers } from './services/socketService';
import { startCleanupService } from './services/cleanupService';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

const clientUrlString = process.env.CLIENT_URL || 'http://localhost:3000';
console.log('Client URL string:', clientUrlString);

const clientUrls = clientUrlString.split(',');
console.log('Parsed client URLs:', clientUrls);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    console.log('Request origin:', origin);
    if (!origin || clientUrls.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Error handling middleware
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',  // Allow all origins in development
    methods: ['GET', 'POST']
  }
});

// Set up socket handlers
setupSocketHandlers(io);

// Start the cleanup service
startCleanupService();

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 