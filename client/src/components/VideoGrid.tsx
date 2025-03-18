import React, { useRef, useEffect } from 'react';
import { User } from '../types';

interface VideoGridProps {
  localStream: MediaStream | null;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  peers: Record<string, User>;
  userId: string;
  userName: string;
  isScreenSharing: boolean;
  screenStream: MediaStream | null;
}

const VideoGrid: React.FC<VideoGridProps> = ({
  localStream,
  localVideoRef,
  peers,
  userId,
  userName,
  isScreenSharing,
  screenStream
}) => {
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const peerVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  
  // Set srcObject for screen sharing
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);
  
  // Set srcObject for peer videos
  useEffect(() => {
    Object.entries(peers).forEach(([peerId, peer]) => {
      if (peerVideoRefs.current[peerId] && peer.stream) {
        peerVideoRefs.current[peerId]!.srcObject = peer.stream;
      }
    });
  }, [peers]);

  // Calculate grid layout based on number of participants
  const totalParticipants = Object.keys(peers).length + 1 + (isScreenSharing ? 1 : 0);

  return (
    <div className="grid grid-cols-3 gap-2 w-full h-full">
      {/* Local user video */}
      <div className="relative rounded-lg overflow-hidden bg-gray-800">
        <video
          ref={localVideoRef}
          muted
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-sm">
          {userName} (You)
        </div>
      </div>
      
      {/* Screen sharing video (if active) */}
      {isScreenSharing && screenStream && (
        <div className="relative rounded-lg overflow-hidden bg-gray-800">
          <video
            ref={screenVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-sm">
            Your Screen
          </div>
        </div>
      )}
      
      {/* Remote peers videos */}
      {Object.entries(peers).map(([peerId, peer]) => (
        peer.stream ? (
          <div key={peerId} className="relative rounded-lg overflow-hidden bg-gray-800">
            <video
              ref={el => peerVideoRefs.current[peerId] = el}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-sm">
              {peer.name || 'Participant'}
            </div>
          </div>
        ) : (
          <div key={peerId} className="flex items-center justify-center rounded-lg bg-gray-800">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500 text-white text-2xl font-semibold">
              {peer.name ? peer.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-sm">
              {peer.name || 'Participant'}
            </div>
          </div>
        )
      ))}
      
      {/* Empty placeholders for grid layout */}
      {Array.from({ length: Math.max(0, 9 - totalParticipants) }).map((_, index) => (
        <div key={`empty-${index}`} className="rounded-lg bg-gray-900"></div>
      ))}
    </div>
  );
};

export default VideoGrid; 