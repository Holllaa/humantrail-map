
import { useState, useEffect, useRef } from 'react';

// Define the types for our tracking data
export type PathPoint = {
  x: number;
  y: number;
  timestamp: number;
};

export type PersonTrack = {
  id: string;
  path: PathPoint[];
  active: boolean;
};

interface DetectedPerson {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}

// Custom hook for tracking people in video
export const useTracking = () => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [personTracks, setPersonTracks] = useState<PersonTrack[]>([]);
  const [detectedPersons, setDetectedPersons] = useState<DetectedPerson[]>([]);
  const trackingModelRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load the tracking model on component mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        // Mock model loading for demonstration
        // In a real implementation, you would load the actual model
        // const model = await cocoSsd.load();
        // trackingModelRef.current = model;
        
        // Simulate model loading time
        await new Promise(resolve => setTimeout(resolve, 2000));
        trackingModelRef.current = { detect: mockDetect };
        
        setIsModelLoaded(true);
      } catch (error) {
        console.error('Failed to load tracking model:', error);
      }
    };

    loadModel();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  // Mock detect function for demonstration
  const mockDetect = async (video: HTMLVideoElement): Promise<DetectedPerson[]> => {
    // Simulate detection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate 1-3 random people detections
    const numPeople = Math.floor(Math.random() * 3) + 1;
    const detections: DetectedPerson[] = [];
    
    for (let i = 0; i < numPeople; i++) {
      const x = Math.random() * (video.videoWidth - 100);
      const y = Math.random() * (video.videoHeight - 200);
      
      detections.push({
        bbox: [x, y, 50 + Math.random() * 30, 100 + Math.random() * 50],
        class: 'person',
        score: 0.7 + Math.random() * 0.3
      });
    }
    
    return detections;
  };

  // Start tracking people
  const startTracking = (video: HTMLVideoElement) => {
    if (!isModelLoaded || !trackingModelRef.current) return;
    
    videoRef.current = video;
    setIsProcessing(true);
    lastDetectionTimeRef.current = Date.now();
    
    // Run detection at regular intervals
    trackingIntervalRef.current = setInterval(() => {
      detectPeople();
    }, 500);
  };

  // Detect people in the current video frame
  const detectPeople = async () => {
    if (!videoRef.current || !trackingModelRef.current) return;
    
    try {
      const detections = await trackingModelRef.current.detect(videoRef.current);
      const persons = detections.filter(detection => 
        detection.class === 'person' && detection.score > 0.7
      );
      
      setDetectedPersons(persons);
      updatePersonTracks(persons);
    } catch (error) {
      console.error('Error detecting people:', error);
    }
  };

  // Update person tracks based on new detections
  const updatePersonTracks = (persons: DetectedPerson[]) => {
    const currentTime = Date.now();
    
    setPersonTracks(prevTracks => {
      // Updated version to ensure we return the correct type
      const updatedTracks: PersonTrack[] = [...prevTracks];
      
      // Mark existing tracks as inactive initially
      updatedTracks.forEach(track => {
        track.active = false;
      });
      
      // Update tracks with new detections
      persons.forEach(person => {
        const [x, y, width, height] = person.bbox;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // Find closest existing track
        let closestTrack: PersonTrack | null = null;
        let minDistance = 100; // Threshold for considering it's the same person
        
        updatedTracks.forEach(track => {
          if (track.path.length > 0) {
            const lastPoint = track.path[track.path.length - 1];
            const distance = Math.sqrt(
              Math.pow(centerX - lastPoint.x, 2) + 
              Math.pow(centerY - lastPoint.y, 2)
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              closestTrack = track;
            }
          }
        });
        
        if (closestTrack) {
          // Update existing track
          closestTrack.path.push({
            x: centerX,
            y: centerY,
            timestamp: currentTime
          });
          closestTrack.active = true;
        } else {
          // Create new track
          const newTrack: PersonTrack = {
            id: `person-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            path: [{
              x: centerX,
              y: centerY,
              timestamp: currentTime
            }],
            active: true
          };
          updatedTracks.push(newTrack);
        }
      });
      
      // Prune inactive tracks older than 5 seconds
      const cutoffTime = currentTime - 5000;
      return updatedTracks.filter(track => 
        track.active || 
        (track.path.length > 0 && track.path[track.path.length - 1].timestamp > cutoffTime)
      );
    });
  };

  // Stop tracking
  const stopTracking = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    setIsProcessing(false);
  };

  // Reset tracking data
  const resetTracking = () => {
    setPersonTracks([]);
    setDetectedPersons([]);
  };

  return {
    isModelLoaded,
    isProcessing,
    personTracks,
    detectedPersons,
    startTracking,
    stopTracking,
    resetTracking
  };
};
