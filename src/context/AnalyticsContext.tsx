
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Define types for our context
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

export type HeatmapData = {
  x: number;
  y: number;
  value: number;
};

export type StoreLayout = {
  imageUrl: string | null;
  width: number;
  height: number;
  scale: number;
};

type AnalyticsContextType = {
  tracks: PersonTrack[];
  heatmapData: HeatmapData[];
  storeLayout: StoreLayout;
  videoSrc: string | null;
  isProcessing: boolean;
  isModelLoaded: boolean;
  processingProgress: number;
  // Actions
  setTracks: (tracks: PersonTrack[]) => void;
  addTrackPoint: (id: string, point: PathPoint) => void;
  setHeatmapData: (data: HeatmapData[]) => void;
  setStoreLayout: (layout: Partial<StoreLayout>) => void;
  setVideoSrc: (src: string | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setIsModelLoaded: (isLoaded: boolean) => void;
  setProcessingProgress: (progress: number) => void;
  clearAllData: () => void;
};

const defaultStoreLayout: StoreLayout = {
  imageUrl: null,
  width: 800,
  height: 600,
  scale: 1,
};

// Create the context
const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Create provider component
export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const [tracks, setTracks] = useState<PersonTrack[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [storeLayout, setStoreLayout] = useState<StoreLayout>(defaultStoreLayout);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Add a point to a person's track
  const addTrackPoint = useCallback((id: string, point: PathPoint) => {
    setTracks(prevTracks => {
      const trackIndex = prevTracks.findIndex(track => track.id === id);
      if (trackIndex === -1) {
        // Create a new track if it doesn't exist
        return [...prevTracks, { id, path: [point], active: true }];
      } else {
        // Add to existing track
        const updatedTracks = [...prevTracks];
        updatedTracks[trackIndex] = {
          ...updatedTracks[trackIndex],
          path: [...updatedTracks[trackIndex].path, point],
        };
        return updatedTracks;
      }
    });
  }, []);

  // Update store layout with partial data
  const updateStoreLayout = useCallback((layout: Partial<StoreLayout>) => {
    setStoreLayout(prev => ({ ...prev, ...layout }));
  }, []);

  // Clear all data
  const clearAllData = useCallback(() => {
    setTracks([]);
    setHeatmapData([]);
    setVideoSrc(null);
    setIsProcessing(false);
    setProcessingProgress(0);
  }, []);

  const value = {
    tracks,
    heatmapData,
    storeLayout,
    videoSrc,
    isProcessing,
    isModelLoaded,
    processingProgress,
    setTracks,
    addTrackPoint,
    setHeatmapData,
    setStoreLayout: updateStoreLayout,
    setVideoSrc,
    setIsProcessing,
    setIsModelLoaded,
    setProcessingProgress,
    clearAllData,
  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
};

// Create a hook to use the context
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
