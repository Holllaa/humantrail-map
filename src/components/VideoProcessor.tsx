import React, { useEffect, useRef, useState } from 'react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useTracking } from '@/hooks/useTracking';
import { generateHeatmapFromTracks } from '@/utils/tracking';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const VideoProcessor: React.FC = () => {
  const { setVideoSrc, setIsProcessing, setHeatmapData, setTracks, setProcessingProgress, clearAllData } = useAnalytics();
  const { isModelLoaded, isProcessing, personTracks, startTracking, stopTracking, resetTracking } = useTracking();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  // Load video when file is selected
  useEffect(() => {
    if (!videoFile) return;

    const videoURL = URL.createObjectURL(videoFile);
    setVideoSrc(videoURL);

    // Load video metadata to get dimensions
    const video = videoRef.current;
    if (video) {
      video.onloadedmetadata = () => {
        // Play the video briefly to ensure dimensions are loaded
        video.play().then(() => {
          video.pause();
        }).catch(error => {
          console.error("Error autoplaying video:", error);
        });
      };
    }
  }, [videoFile, setVideoSrc]);

  // Start tracking when processing starts
  useEffect(() => {
    if (isProcessing && videoRef.current) {
      startTracking(videoRef.current);
    } else if (!isProcessing) {
      stopTracking();
    }
  }, [isProcessing, startTracking, stopTracking]);

  // Update analytics context with tracking data
  useEffect(() => {
    setTracks(personTracks);
  }, [personTracks, setTracks]);

  // Generate heatmap data when tracking data changes
  useEffect(() => {
    if (personTracks.length === 0) {
      setHeatmapData([]);
      return;
    }

    if (!videoRef.current) return;

    const heatmapData = generateHeatmapFromTracks(
      personTracks,
      videoRef.current.videoWidth,
      videoRef.current.videoHeight
    );
    setHeatmapData(heatmapData);
  }, [personTracks, setHeatmapData]);

  // Handle video upload
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
    }
  };

  // Start processing
  const handleProcessVideo = async () => {
    if (!videoFile) {
      toast.error('Please upload a video first');
      return;
    }

    if (!isModelLoaded) {
      toast.error('Tracking model is still loading. Please wait.');
      return;
    }

    setIsProcessing(true);
    setProcessing(true);
    setProcessingProgress(0);
    resetTracking();
    toast.loading('Starting video processing...', { id: 'processing' });

    // Simulate processing progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setProcessingProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setIsProcessing(false);
        setProcessing(false);
        toast.success('Video processing complete!', { id: 'processing' });
      }
    }, 500);
  };

  // Stop processing
  const handleStopProcessing = () => {
    setIsProcessing(false);
    setProcessing(false);
    toast.success('Video processing stopped.', { id: 'processing' });
  };

  // Clear all data
  const handleClearData = () => {
    clearAllData();
    setVideoFile(null);
    resetTracking();
    toast.info('All data cleared.');
  };

  return (
    <div className="w-full space-y-4">
      <h3 className="text-lg font-medium">Video Processing</h3>

      {/* Video Upload Zone */}
      {!videoFile ? (
        <div
          id="upload-zone"
          className="upload-zone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <label htmlFor="video-input">
            <div className="upload-content">
              <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p>Drag & drop video or click to browse</p>
            </div>
            <input
              type="file"
              id="video-input"
              accept="video/*"
              hidden
              onChange={handleVideoUpload}
              ref={fileInputRef}
            />
          </label>
        </div>
      ) : (
        <div className="glass-panel p-4 space-y-4">
          <h4 className="text-md font-medium">Uploaded Video</h4>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
            <video
              ref={videoRef}
              src={URL.createObjectURL(videoFile)}
              controls
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{videoFile.name}</span>
            <span>{videoFile.size} KB</span>
          </div>
        </div>
      )}

      {/* Processing Controls */}
      <div className="flex justify-between items-center">
        <div>
          <Button
            onClick={handleProcessVideo}
            disabled={processing || !videoFile || !isModelLoaded}
          >
            {processing ? 'Processing...' : 'Process Video'}
          </Button>
          {processing && (
            <Button
              variant="secondary"
              onClick={handleStopProcessing}
              className="ml-2"
            >
              Stop Processing
            </Button>
          )}
        </div>
        <Button
          variant="destructive"
          onClick={handleClearData}
          disabled={processing}
        >
          Clear All Data
        </Button>
      </div>

      {/* Progress Bar */}
      {processing && (
        <div className="w-full">
          <Progress value={setProcessingProgress} />
        </div>
      )}
    </div>
  );
};

export default VideoProcessor;
