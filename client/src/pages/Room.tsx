import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import VideoGrid from '../components/VideoGrid';
import Controls from '../components/Controls';
import Chat from '../components/Chat';
import { User, Message } from '../types';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface RoomParams {
  roomId: string;
}

interface RoomProps {
  userId: string;
}

const Room: React.FC<RoomProps> = ({ userId }) => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [peers, setPeers] = useState<Record<string, User>>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const userName = user?.name || localStorage.getItem('userName') || 'Anonymous';

  useEffect(() => {
    if (!roomId) return;
    
    // Fetch room details
    const fetchRoomDetails = async () => {
      try {
        console.log(`Fetching room details for room ID: ${roomId}`);
        console.log(`API URL: ${axios.defaults.baseURL || 'Not set'}`);
        
        const response = await axios.get(`http://localhost:5000/api/rooms/${roomId}`);
        console.log('Room details response:', response.data);
        setRoomName(response.data.name);
      } catch (error) {
        console.error('Error fetching room details:', error);
        alert('Room not found. Redirecting to home page.');
        navigate('/');
      }
    };
    
    fetchRoomDetails();
    
    // Initialize media stream
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Initialize socket connection after media is ready
        initializeSocketConnection(stream);
      } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Failed to access camera and microphone. Please check permissions.');
      }
    };
    
    initializeMedia();
    
    return () => {
      console.log('Cleaning up room resources');
      
      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach(pc => {
        pc.close();
      });
      
      // Stop all media tracks
      if (localStream) {
        localStream.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind);
          track.stop();
        });
      }
      
      if (screenStream) {
        screenStream.getTracks().forEach(track => {
          console.log('Stopping screen track');
          track.stop();
        });
      }
      
      // Clear state
      setLocalStream(null);
      setScreenStream(null);
    };
  }, [roomId, navigate]);

  const initializeSocketConnection = (stream: MediaStream) => {
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      socketRef.current?.emit('join-room', roomId, userId, userName);
    });
    
    socketRef.current.on('user-connected', (newUserId: string, newUserName: string) => {
      console.log(`User connected: ${newUserId} (${newUserName})`);
      // Create a new peer connection for the new user
      createPeerConnection(newUserId, newUserName, stream, true);
    });
    
    socketRef.current.on('user-disconnected', (disconnectedUserId: string) => {
      console.log(`User disconnected: ${disconnectedUserId}`);
      
      // Close and remove the peer connection
      if (peerConnectionsRef.current[disconnectedUserId]) {
        peerConnectionsRef.current[disconnectedUserId].close();
        delete peerConnectionsRef.current[disconnectedUserId];
      }
      
      // Remove the peer from state
      setPeers(prevPeers => {
        const newPeers = { ...prevPeers };
        delete newPeers[disconnectedUserId];
        return newPeers;
      });
    });
    
    socketRef.current.on('offer', async (offer: RTCSessionDescriptionInit, fromUserId: string) => {
      console.log(`Received offer from ${fromUserId}`);
      const peerName = peers[fromUserId]?.name || 'Unknown';
      const pc = createPeerConnection(fromUserId, peerName, stream, false);
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socketRef.current?.emit('answer', answer, fromUserId);
    });
    
    socketRef.current.on('answer', async (answer: RTCSessionDescriptionInit, fromUserId: string) => {
      console.log(`Received answer from ${fromUserId}`);
      const pc = peerConnectionsRef.current[fromUserId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });
    
    socketRef.current.on('ice-candidate', async (candidate: RTCIceCandidateInit, fromUserId: string) => {
      console.log(`Received ICE candidate from ${fromUserId}`);
      const pc = peerConnectionsRef.current[fromUserId];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
    
    socketRef.current.on('user-screen-share-started', (sharingUserId: string) => {
      setPeers(prevPeers => ({
        ...prevPeers,
        [sharingUserId]: {
          ...prevPeers[sharingUserId],
          isScreenSharing: true
        }
      }));
    });
    
    socketRef.current.on('user-screen-share-stopped', (sharingUserId: string) => {
      setPeers(prevPeers => ({
        ...prevPeers,
        [sharingUserId]: {
          ...prevPeers[sharingUserId],
          isScreenSharing: false
        }
      }));
    });
    
    socketRef.current.on('receive-message', (message: Message) => {
      // Add all messages to the state when they come from the server
      setMessages(prevMessages => [...prevMessages, message]);
      
      // Only show notifications for messages from others
      if (!isChatOpen && message.senderId !== userId) {
        setUnreadMessages(prev => prev + 1);
        
        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`New message from ${message.sender}`, {
            body: message.text.substring(0, 50) + (message.text.length > 50 ? '...' : '')
          });
        }
      }
    });
  };

  const createPeerConnection = (peerId: string, peerName: string, stream: MediaStream, isInitiator: boolean): RTCPeerConnection => {
    // Check if connection already exists
    if (peerConnectionsRef.current[peerId]) {
      return peerConnectionsRef.current[peerId];
    }
    
    // Create a new RTCPeerConnection
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    
    // Add local stream tracks to the connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });
    
    // Add screen sharing stream if active
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        pc.addTrack(track, screenStream);
      });
    }
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', event.candidate, peerId);
      }
    };
    
    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log(`Received tracks from ${peerId}`);
      
      setPeers(prevPeers => ({
        ...prevPeers,
        [peerId]: {
          ...prevPeers[peerId],
          id: peerId,
          stream: event.streams[0],
          name: peerName
        }
      }));
    };
    
    // If this peer is the initiator, create and send an offer
    if (isInitiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          socketRef.current?.emit('offer', pc.localDescription, peerId);
        })
        .catch(error => {
          console.error('Error creating offer:', error);
        });
    }
    
    // Store the peer connection
    peerConnectionsRef.current[peerId] = pc;
    
    // Initialize peer in state if not already there
    setPeers(prevPeers => {
      if (!prevPeers[peerId]) {
        return {
          ...prevPeers,
          [peerId]: { id: peerId, name: peerName }
        };
      }
      return prevPeers;
    });
    
    return pc;
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStream) {
        screenStream.getTracks().forEach(track => {
          track.stop();
          
          // Remove screen share tracks from all peer connections
          Object.values(peerConnectionsRef.current).forEach(pc => {
            pc.getSenders().forEach(sender => {
              if (sender.track && sender.track.id === track.id) {
                pc.removeTrack(sender);
              }
            });
          });
        });
        
        setScreenStream(null);
        setIsScreenSharing(false);
        socketRef.current?.emit('screen-share-stopped');
      }
    } else {
      // Start screen sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        setScreenStream(stream);
        setIsScreenSharing(true);
        
        // Add screen share track to all peer connections
        stream.getTracks().forEach(track => {
          Object.values(peerConnectionsRef.current).forEach(pc => {
            pc.addTrack(track, stream);
          });
          
          // Handle the case when user stops sharing via the browser UI
          track.onended = () => {
            toggleScreenShare();
          };
        });
        
        socketRef.current?.emit('screen-share-started');
      } catch (error) {
        console.error('Error sharing screen:', error);
        alert('Failed to share screen. Please try again.');
      }
    }
  };

  const sendMessage = (text: string) => {
    if (text.trim() && socketRef.current) {
      const message: Message = {
        text,
        sender: userName,
        senderId: userId,
        timestamp: new Date().toISOString()
      };
      
      // Only emit the message, don't add it to state here
      socketRef.current.emit('send-message', message, roomId);
      
      // The message will be added to state when it comes back from the server
      // This ensures consistent ordering and handling for all messages
    }
  };

  const leaveRoom = () => {
    console.log('Leaving room, cleaning up resources...');
    
    // Stop all media tracks before navigating
    if (localStream) {
      console.log('Stopping local stream tracks');
      localStream.getTracks().forEach(track => {
        console.log(`Stopping ${track.kind} track`);
        track.stop();
      });
      setLocalStream(null);
    }
    
    if (screenStream) {
      console.log('Stopping screen sharing tracks');
      screenStream.getTracks().forEach(track => {
        track.stop();
      });
      setScreenStream(null);
    }
    
    // Close all peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => {
      pc.close();
    });
    peerConnectionsRef.current = {};
    
    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // Navigate away
    navigate('/');
  };

  // Create participants object for the chat component
  const participants = {
    [userId]: { name: userName },
    ...Object.entries(peers).reduce((acc, [id, peer]) => {
      acc[id] = { name: peer.name || 'Unknown' };
      return acc;
    }, {} as Record<string, { name: string }>)
  };

  // Reset unread count when opening chat
  const handleOpenChat = () => {
    setIsChatOpen(true);
    setUnreadMessages(0);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h1 className="text-xl font-semibold">{roomName || 'Video Conference'}</h1>
        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-400">Room ID: {roomId}</span>
          <button 
            className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded-md"
            onClick={() => navigator.clipboard.writeText(roomId || '')}
          >
            Copy
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 p-4 ${isChatOpen ? 'pr-0' : ''}`}>
          <VideoGrid
            localStream={localStream}
            localVideoRef={localVideoRef}
            peers={peers}
            userId={userId}
            userName={userName}
            isScreenSharing={isScreenSharing}
            screenStream={screenStream}
          />
        </div>
        
        {isChatOpen && (
          <Chat
            messages={messages}
            sendMessage={sendMessage}
            onClose={() => setIsChatOpen(false)}
            userId={userId}
            participants={participants}
          />
        )}
      </div>
      
      <Controls
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        toggleScreenShare={toggleScreenShare}
        toggleChat={handleOpenChat}
        leaveRoom={leaveRoom}
        isAudioMuted={isAudioMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        isChatOpen={isChatOpen}
        unreadMessages={unreadMessages}
      />
    </div>
  );
};

export default Room; 