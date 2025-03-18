import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { v4 as uuidv4 } from 'uuid';
import { Room } from '../types';
import { useAuth } from '../context/AuthContext';

interface HomeProps {
  userId: string;
}

const Home: React.FC<HomeProps> = ({ userId }) => {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    // Set username from auth context if available
    if (user && user.name) {
      setUserName(user.name);
      localStorage.setItem('userName', user.name);
    } else {
      const storedName = localStorage.getItem('userName');
      if (storedName) {
        setUserName(storedName);
      }
    }

    // Fetch available rooms
    fetchRooms();
  }, [user]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!roomName.trim()) {
      alert('Please enter a room name');
      return;
    }

    try {
      const response = await api.post('/api/rooms', { 
        name: roomName,
        isPrivate 
      });
      const newRoom = response.data;
      
      // Save username to localStorage
      localStorage.setItem('userName', userName || user?.name || 'Anonymous');
      
      // Navigate to the new room
      navigate(`/room/${newRoom.id}`);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const joinRoom = (roomId: string) => {
    // Save username to localStorage
    localStorage.setItem('userName', userName || user?.name || 'Anonymous');
    
    // Navigate to the room
    navigate(`/room/${roomId}`);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Video Conference</h1>
          <div className="flex items-center">
            <span className="mr-4">Welcome, {user?.name || userName || 'Anonymous'}</span>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create a New Room</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Your Name"
              value={userName || user?.name || ''}
              onChange={(e) => setUserName(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-md flex-1"
              disabled={!!user?.name}
            />
            <input
              type="text"
              placeholder="Room Name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-md flex-1"
            />
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 rounded bg-gray-700"
              />
              <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-300">
                Make room private (only visible to logged-in users)
              </label>
            </div>
            <button
              onClick={createRoom}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-md"
            >
              Create Room
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div key={room.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium">{room.name}</h3>
                    {room.isPrivate && (
                      <span className="bg-gray-700 text-xs px-2 py-1 rounded-full text-gray-300">
                        Private
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    Created: {new Date(room.createdAt).toLocaleString()}
                  </p>
                  <button
                    onClick={() => joinRoom(room.id)}
                    className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 