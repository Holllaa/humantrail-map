
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnalytics, PathPoint, PersonTrack } from '@/context/AnalyticsContext';
import { generateHeatmapFromTracks } from '@/utils/tracking';

interface UseTrackingOptions {
  onModelLoaded?: () => void;
  onError?: (error: Error) => void;
}

const useTracking = (options?: UseTrackingOptions) => {
  const { 
    tracks, 
    setTracks, 
    addTrackPoint, 
    setHeatmapData, 
    videoSrc, 
    isProcessing, 
    setIsProcessing, 
    setProcessingProgress 
  } = useAnalytics();
  
  const [currentFrame, setCurrentFrame] = useState<ImageData | null>(null);
  const frameRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const requestIdRef = useRef<number | null>(null);
  
  // Initialize tracking
  const initTracking = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!videoElement) return;
    
    videoRef.current = videoElement;
    setIsProcessing(true);
    setProcessingProgress(0);
    
    // Reset tracks
    setTracks([]);
    
    // Setup canvas for frame processing
    if (!frameRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      frameRef.current = canvas;
    }
    
    // Start processing video frames
    processFrame();
    
    // Simulate model loading
    setTimeout(() => {
      options?.onModelLoaded?.();
    }, 1500);
    
    setIsProcessing(false);
  }, [setIsProcessing, setProcessingProgress, setTracks, options]);
  
  // Process individual video frame
  const processFrame = useCallback(() => {
    if (!videoRef.current || !frameRef.current) return;
    
    const video = videoRef.current;
    const canvas = frameRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Draw the current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setCurrentFrame(imageData);
    
    // Mock detection and tracking
    mockDetectAndTrack(imageData);
    
    // Continue processing frames
    requestIdRef.current = requestAnimationFrame(processFrame);
  }, []);
  
  // Mock detection and tracking (to be replaced with real ML model)
  const mockDetectAndTrack = useCallback((imageData: ImageData) => {
    // Create random movement patterns for demonstration
    const timestamp = Date.now();
    const width = imageData.width;
    const height = imageData.height;
    
    // Update existing tracks with new positions
    setTracks((prevTracks: PersonTrack[]) => {
      const updatedTracks = prevTracks.map(track => {
        const lastPoint = track.path[track.path.length - 1];
        
        // Generate next point with some randomness but following a pattern
        const nextX = Math.max(0, Math.min(width, lastPoint.x + (Math.random() - 0.5) * 20));
        const nextY = Math.max(0, Math.min(height, lastPoint.y + (Math.random() - 0.5) * 20));
        
        // Add new point to path
        const newPoint: PathPoint = {
          x: nextX,
          y: nextY,
          timestamp
        };
        
        return {
          ...track,
          path: [...track.path, newPoint]
        };
      });
      
      return updatedTracks;
    });
    
    // Occasionally add new tracks
    if (Math.random() < 0.01 && tracks.length < 10) {
      const newTrackId = `person_${Date.now()}`;
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      
      addTrackPoint(newTrackId, {
        x: startX,
        y: startY,
        timestamp
      });
    }
    
    // Generate heatmap data from tracks
    setHeatmapData(generateHeatmapFromTracks(tracks, width, height));
  }, [tracks, addTrackPoint, setHeatmapData, setTracks]);
  
  // Start processing method for external components
  const startProcessing = useCallback(() => {
    if (!videoRef.current) {
      console.error("Video element not initialized");
      options?.onError?.(new Error("Video element not initialized"));
      return;
    }
    
    setIsProcessing(true);
    videoRef.current.play();
    processFrame();
  }, [processFrame, setIsProcessing, options]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, []);
  
  return {
    currentFrame,
    initTracking,
    videoRef,
    canvasRef,
    startProcessing
  };
};

export default useTracking;
