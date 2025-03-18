import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon, FaceSmileIcon } from '@heroicons/react/24/solid';

interface Message {
  text: string;
  sender: string;
  senderId: string;
  timestamp: string;
}

interface ChatProps {
  messages: Message[];
  sendMessage: (message: string) => void;
  onClose: () => void;
  userId: string;
  participants: Record<string, { name: string, role?: string }>;
}

const Chat: React.FC<ChatProps> = ({ messages, sendMessage, onClose, userId, participants }) => {
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="flex flex-col w-80 bg-gray-900 border-l border-gray-800 h-full">
      <div className="flex border-b border-gray-800">
        <button 
          className={`flex-1 py-3 text-center ${activeTab === 'chat' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'}`}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
        <button 
          className={`flex-1 py-3 text-center ${activeTab === 'participants' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'}`}
          onClick={() => setActiveTab('participants')}
        >
          Participants
        </button>
        <button 
          className="p-3 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      
      {activeTab === 'chat' ? (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex flex-col ${message.senderId === userId ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center mb-1">
                  <span className="text-sm font-medium text-white">{message.sender}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div 
                  className={`px-3 py-2 rounded-lg max-w-xs break-words ${
                    message.senderId === userId 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-3 border-t border-gray-800">
            <div className="flex items-center bg-gray-800 rounded-lg">
              <textarea
                className="flex-1 bg-transparent border-none outline-none resize-none p-2 text-white placeholder-gray-400"
                placeholder="Send a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={1}
              />
              <button 
                className="p-2 text-gray-400 hover:text-white"
                onClick={handleSendMessage}
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(participants).map(([id, participant]) => (
            <div key={id} className="flex items-center py-2 border-b border-gray-800">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-500 text-white font-semibold">
                {participant.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <div className="text-white font-medium">
                  {participant.name} {id === userId && '(You)'}
                </div>
                {participant.role && (
                  <div className="text-sm text-gray-400">{participant.role}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Chat; 