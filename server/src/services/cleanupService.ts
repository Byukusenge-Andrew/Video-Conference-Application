import { prisma } from '../prisma/client';

export const startCleanupService = () => {
  // Run cleanup every 24 hours (86400000 ms)
  setInterval(async () => {
    try {
      console.log('Running room cleanup job');
      
      // Find rooms with no active sessions for more than 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      // Get rooms where all sessions have ended
      const inactiveRooms = await prisma.room.findMany({
        where: {
          isActive: true,
          sessions: {
            every: {
              leftAt: {
                not: null,
                lt: oneDayAgo
              }
            }
          }
        }
      });
      
      console.log(`Found ${inactiveRooms.length} inactive rooms to clean up`);
      
      // Mark rooms as inactive
      for (const room of inactiveRooms) {
        await prisma.room.update({
          where: { id: room.id },
          data: { isActive: false }
        });
      }
      
      console.log('Room cleanup completed');
    } catch (error) {
      console.error('Error in room cleanup job:', error);
    }
  }, 86400000); // 24 hours
  
  console.log('Room cleanup service started');
}; 