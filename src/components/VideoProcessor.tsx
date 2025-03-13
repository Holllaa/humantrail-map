
import React, { useCallback, useState } from 'react';
import useTracking from '@/hooks/useTracking';
import { useAnalytics } from '@/context/AnalyticsContext';
import { toast } from 'sonner';
import { Play, Pause, RefreshCw, RotateCcw } from 'lucide-react';
import UploadZone from './UploadZone';
import { generateHeatmapFromTracks } from '@/utils/tracking';

const VideoProcessor: React.FC = () => {
  const { 
    videoSrc, 
    setHeatmapData, 
    storeLayout, 
    isProcessing, 
    setIsProcessing 
  } = useAnalytics();
  
  const [isPaused, setIsPaused] = useState(false);
  
  const { videoRef, canvasRef, startProcessing } = useTracking({
    onModelLoaded: () => {
      toast.success('Tracking model ready for processing');
    },
    onError: (error) => {
      toast.error(`Model error: ${error.message}`);
    }
  });
  
  // Handle video pause/resume
  const togglePause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
    }
  }, [videoRef]);
  
  // Start processing the video
  const handleStartProcessing = useCallback(() => {
    startProcessing();
  }, [startProcessing]);
  
  // Generate heatmap from current tracking data
  const generateHeatmap = useCallback(() => {
    const { tracks } = useAnalytics();
    const heatmapData = generateHeatmapFromTracks(
      tracks,
      storeLayout.width,
      storeLayout.height
    );
    setHeatmapData(heatmapData);
    toast.success('Heatmap generated from current data');
  }, [storeLayout.width, storeLayout.height, setHeatmapData]);
  
  return (
    <div className="w-full space-y-4 animate-fade-up">
      {!videoSrc ? (
        // Video upload zone
        <UploadZone type="video" />
      ) : (
        // Video player with controls
        <div className="glass-panel p-4 space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
            <video 
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-contain"
              controls={false}
            />
            <canvas 
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
            
            {/* Processing overlay */}
            {isProcessing && (
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                Processing...
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={togglePause}
                className="px-3 py-2 bg-retail-blue text-white rounded-lg flex items-center space-x-1 hover:bg-retail-blue/90 transition-colors"
                disabled={!isProcessing}
              >
                {isPaused ? (
                  <><Play size={16} /> <span>Resume</span></>
                ) : (
                  <><Pause size={16} /> <span>Pause</span></>
                )}
              </button>
              
              <button
                onClick={handleStartProcessing}
                className="px-3 py-2 bg-retail-green text-white rounded-lg flex items-center space-x-1 hover:bg-retail-green/90 transition-colors"
                disabled={isProcessing}
              >
                <Play size={16} />
                <span>Start Processing</span>
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={generateHeatmap}
                className="px-3 py-2 bg-retail-purple text-white rounded-lg flex items-center space-x-1 hover:bg-retail-purple/90 transition-colors"
              >
                <RefreshCw size={16} />
                <span>Generate Heatmap</span>
              </button>
              
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                  }
                }}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg flex items-center space-x-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoProcessor;
