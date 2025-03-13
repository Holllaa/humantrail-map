
import React, { useRef, useEffect, useState } from 'react';
import { useAnalytics, PersonTrack } from '@/context/AnalyticsContext';
import { generatePathString, smoothPath } from '@/utils/tracking';

const TrackingView: React.FC = () => {
  const { tracks, storeLayout } = useAnalytics();
  const containerRef = useRef<HTMLDivElement>(null);
  const [contWidth, setContWidth] = useState(0);
  const [contHeight, setContHeight] = useState(0);
  
  // Update container dimensions when store layout changes
  useEffect(() => {
    if (containerRef.current) {
      const updateDimensions = () => {
        if (containerRef.current) {
          setContWidth(containerRef.current.offsetWidth);
          setContHeight(containerRef.current.offsetHeight);
        }
      };
      
      updateDimensions();
      
      // Add window resize listener
      window.addEventListener('resize', updateDimensions);
      
      return () => {
        window.removeEventListener('resize', updateDimensions);
      };
    }
  }, [storeLayout]);
  
  // Calculate scale factor for proper rendering
  const scaleFactor = Math.min(
    contWidth / storeLayout.width,
    contHeight / storeLayout.height
  );
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-lg bg-white/50 dark:bg-gray-800/50 shadow-subtle"
    >
      {/* Store layout background */}
      {storeLayout.imageUrl ? (
        <img 
          src={storeLayout.imageUrl} 
          alt="Store Layout"
          className="absolute top-0 left-0 w-full h-full object-contain"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <p className="text-gray-400 dark:text-gray-600">No store layout uploaded</p>
        </div>
      )}
      
      {/* SVG overlay for tracks */}
      <svg 
        className="absolute top-0 left-0 w-full h-full"
        viewBox={`0 0 ${storeLayout.width} ${storeLayout.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Render each track */}
        {tracks.map((track) => (
          <TrackPath key={track.id} track={track} />
        ))}
      </svg>
    </div>
  );
};

// Component for an individual track path
const TrackPath: React.FC<{ track: PersonTrack }> = ({ track }) => {
  // Smooth the path to reduce noise
  const smoothedPath = smoothPath(track.path);
  
  // Generate the SVG path string
  const pathString = generatePathString(smoothedPath);
  
  // Get the last point for the current position
  const lastPoint = track.path[track.path.length - 1];
  
  return (
    <>
      {/* Path line */}
      <path
        d={pathString}
        className={`path-trail ${track.active ? 'path-trail-active' : ''}`}
      />
      
      {/* Current position */}
      {track.active && lastPoint && (
        <>
          {/* Ripple effect */}
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="15"
            className="ripple-effect"
          />
          
          {/* Person indicator */}
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="4"
            className="fill-retail-blue"
          />
        </>
      )}
    </>
  );
};

export default TrackingView;
