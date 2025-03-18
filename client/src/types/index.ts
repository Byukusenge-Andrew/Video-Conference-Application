export interface User {
  id: string;
  name: string;
  stream?: MediaStream;
  isScreenSharing?: boolean;
  role?: string;
}

export interface Message {
  text: string;
  sender: string;
  senderId: string;
  timestamp: string;
}

export interface Room {
  id: string;
  name: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
} 