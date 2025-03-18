import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);
  
  // Check if it's a Prisma error
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      message: 'Database error',
      error: err.message
    });
  }
  
  // Default error response
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
}; 