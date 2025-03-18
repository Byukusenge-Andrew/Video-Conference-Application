import { prisma } from '../prisma/client';

export const createRoom = async (name: string, isPrivate: boolean = false) => {
  return await prisma.room.create({
    data: {
      name,
      isPrivate
    }
  });
};

export const getRoomById = async (id: string) => {
  const room = await prisma.room.findUnique({
    where: { id }
  });
  
  if (!room) {
    throw new Error('Room not found');
  }
  
  return room;
};

export const getRooms = async (showPrivate: boolean = false) => {
  return await prisma.room.findMany({
    where: showPrivate ? {} : { isPrivate: false },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

export const createOrUpdateUser = async (userId: string, userName: string) => {
  let user = await prisma.user.findUnique({ 
    where: { id: userId } 
  });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        name: userName,
        email: `${userId}@example.com` // Placeholder email
      }
    });
  }
  
  return user;
};

export const createSession = async (roomId: string, userId: string) => {
  return await prisma.session.create({
    data: {
      roomId,
      userId
    }
  });
};

export const updateSessionOnDisconnect = async (userId: string, roomId: string) => {
  return await prisma.session.updateMany({
    where: {
      userId,
      roomId,
      leftAt: null
    },
    data: {
      leftAt: new Date()
    }
  });
}; 