import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { User } from '../types';

export const registerUser = async (name: string, email: string, password: string): Promise<{ user: User, token: string }> => {
  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (user) {
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword
    }
  });

  // Create JWT
  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword as User,
    token
  };
};

export const loginUser = async (email: string, password: string): Promise<{ user: User, token: string }> => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password as string);

  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // Create JWT
  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword as User,
    token
  };
};

export const getUserById = async (userId: string): Promise<User> => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  
  return userWithoutPassword as User;
}; 