import { Server, Socket } from 'socket.io';
import { createOrUpdateUser, createSession, updateSessionOnDisconnect } from './roomService';
import { prisma } from '../prisma/client';

// Track active rooms and their participants
const activeRooms: Record<string, Set<string>> = {};

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('New client connected:', socket.id);
    let currentRoomId: string | null = null;
    let currentUserId: string | null = null;

    // Join room
    socket.on('join-room', async ({ roomId, userId, userName }) => {
      try {
        console.log(`User ${userName} (${userId}) joining room ${roomId}`);
        
        // Store current room and user for cleanup on disconnect
        currentRoomId = roomId;
        currentUserId = userId;
        
        // Create or update user in database
        await createOrUpdateUser(userId, userName);
        
        // Create session record
        await createSession(roomId, userId);
        
        // Join socket.io room
        socket.join(roomId);
        
        // Track user in active rooms
        if (!activeRooms[roomId]) {
          activeRooms[roomId] = new Set();
        }
        activeRooms[roomId].add(userId);
        
        // Notify other users in the room
        socket.to(roomId).emit('user-connected', { userId, userName });
        
        // Send list of connected users to the new user
        const connectedSockets = await io.in(roomId).fetchSockets();
        const connectedUsers = connectedSockets
          .filter(s => s.id !== socket.id)
          .map(s => ({
            id: s.data.userId,
            name: s.data.userName
          }));
        
        socket.emit('connected-users', connectedUsers);
        
        // Store user data in socket for easy access
        socket.data.userId = userId;
        socket.data.userName = userName;
        socket.data.roomId = roomId;
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      if (currentRoomId && currentUserId) {
        try {
          // Update session record
          await updateSessionOnDisconnect(currentUserId, currentRoomId);
          
          // Remove user from active room tracking
          if (activeRooms[currentRoomId]) {
            activeRooms[currentRoomId].delete(currentUserId);
            
            // Check if room is empty
            if (activeRooms[currentRoomId].size === 0) {
              console.log(`Room ${currentRoomId} is empty, marking as inactive`);
              delete activeRooms[currentRoomId];
              
              // Optional: Mark room as inactive in database
              await markRoomAsInactive(currentRoomId);
            }
          }
          
          // Notify other users
          socket.to(currentRoomId).emit('user-disconnected', currentUserId);
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });

    // Handle WebRTC signaling
    socket.on('offer', ({ target, caller, offer }) => {
      socket.to(target).emit('offer', { caller, offer });
    });

    socket.on('answer', ({ target, answer }) => {
      socket.to(target).emit('answer', { answer, from: socket.id });
    });

    socket.on('ice-candidate', ({ target, candidate }) => {
      socket.to(target).emit('ice-candidate', { candidate, from: socket.id });
    });

    // Handle chat messages
    socket.on('send-message', (message, roomId) => {
      io.to(roomId || currentRoomId).emit('receive-message', message);
    });
  });
};

// Function to mark a room as inactive
async function markRoomAsInactive(roomId: string) {
  try {
    // Mark the room as inactive
    await prisma.room.update({
      where: { id: roomId },
      data: { isActive: false }
    });
    
    console.log(`Room ${roomId} marked as inactive`);
    
    // Clean up related sessions
    await prisma.session.updateMany({
      where: { 
        roomId,
        leftAt: null
      },
      data: { leftAt: new Date() }
    });
  } catch (error) {
    console.error('Error marking room as inactive:', error);
  }
} 