import React from 'react';
import {
  MicrophoneIcon, VideoCameraIcon, ArrowUpTrayIcon,
  ChatBubbleLeftRightIcon, PhoneXMarkIcon, XMarkIcon,
  NoSymbolIcon
} from '@heroicons/react/24/solid';

// OR use react-icons instead
// import { 
//   FaMicrophone, FaVideo, FaUpload,
//   FaComments, FaPhoneSlash, FaTimes,
//   FaMicrophoneSlash, FaVideoSlash
// } from 'react-icons/fa';

interface ControlsProps {
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  toggleChat: () => void;
  leaveRoom: () => void;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  unreadMessages: number;
}

const Controls: React.FC<ControlsProps> = ({
  toggleAudio,
  toggleVideo,
  toggleScreenShare,
  toggleChat,
  leaveRoom,
  isAudioMuted,
  isVideoOff,
  isScreenSharing,
  isChatOpen,
  unreadMessages
}) => {
  return (
    <div className="flex items-center justify-center space-x-4 py-4 bg-gray-900 border-t border-gray-800">
      <button
        onClick={toggleAudio}
        className={`p-3 rounded-full ${isAudioMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}
        title={isAudioMuted ? "Unmute" : "Mute"}
      >
        {isAudioMuted ? (
          <div className="relative">
            <MicrophoneIcon className="h-6 w-6 text-white" />
            <NoSymbolIcon className="h-6 w-6 text-white absolute top-0 left-0" />
          </div>
        ) : (
          <MicrophoneIcon className="h-6 w-6 text-white" />
        )}
      </button>
      
      <button 
        className={`flex items-center justify-center w-12 h-12 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}
        onClick={toggleVideo}
        title={isVideoOff ? 'Start Video' : 'Stop Video'}
      >
        {isVideoOff ? 
          <VideoCameraIcon className="w-6 h-6 text-white" /> : 
          <VideoCameraIcon className="w-6 h-6 text-white" />
        }
      </button>
      
      <button 
        className={`flex items-center justify-center w-12 h-12 rounded-full ${isScreenSharing ? 'bg-green-500' : 'bg-gray-700 hover:bg-gray-600'}`}
        onClick={toggleScreenShare}
        title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
      >
        <ArrowUpTrayIcon className="w-6 h-6 text-white" />
      </button>
      
      <button 
        className={`flex items-center justify-center w-12 h-12 rounded-full ${isChatOpen ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
        onClick={toggleChat}
        title="Chat"
      >
        <div className="relative">
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
          {unreadMessages > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </div>
      </button>
      
      <button 
        className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 hover:bg-red-700"
        onClick={leaveRoom}
        title="Leave Meeting"
      >
        <PhoneXMarkIcon className="w-6 h-6 text-white" />
      </button>
    </div>
  );
};

export default Controls; 