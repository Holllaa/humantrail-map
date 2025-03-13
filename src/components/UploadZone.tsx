
import React, { useCallback } from 'react';
import { toast } from 'sonner';
import { Upload, FileVideo, Layout } from 'lucide-react';
import { useAnalytics } from '@/context/AnalyticsContext';

interface UploadZoneProps {
  type: 'video' | 'layout';
  onUpload?: (file: File) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ type, onUpload }) => {
  const { setVideoSrc, setStoreLayout } = useAnalytics();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    // Check file type
    if (type === 'video' && !file.type.startsWith('video/')) {
      toast.error('Please upload a valid video file');
      return;
    }

    if (type === 'layout' && !file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    // Process the file
    if (type === 'video') {
      const videoUrl = URL.createObjectURL(file);
      setVideoSrc(videoUrl);
      toast.success('Video uploaded successfully');
    } else if (type === 'layout') {
      const layoutUrl = URL.createObjectURL(file);
      
      // Create an image to get dimensions
      const img = new Image();
      img.onload = () => {
        setStoreLayout({
          imageUrl: layoutUrl,
          width: img.width,
          height: img.height,
          scale: 1,
        });
      };
      img.src = layoutUrl;
      
      toast.success('Store layout uploaded successfully');
    }

    // Call the optional onUpload callback
    if (onUpload) {
      onUpload(file);
    }
  }, [setVideoSrc, setStoreLayout, type, onUpload]);

  return (
    <div 
      className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center transition-all duration-200 ease-in-out hover:border-retail-blue dark:hover:border-retail-blue/70 cursor-pointer bg-gray-50 dark:bg-gray-800/50"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById(`file-upload-${type}`)?.click()}
    >
      <input
        id={`file-upload-${type}`}
        type="file"
        accept={type === 'video' ? 'video/*' : 'image/*'}
        className="hidden"
        onChange={handleFileInput}
      />
      
      <div className="flex flex-col items-center justify-center space-y-3">
        {type === 'video' ? (
          <FileVideo className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        ) : (
          <Layout className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        )}
        
        <div className="text-lg font-medium">
          {type === 'video' ? 'Upload CCTV Footage' : 'Upload Store Layout'}
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          {type === 'video' 
            ? 'Drag and drop a video file or click to select' 
            : 'Drag and drop a floor plan image or click to select'}
        </p>
        
        <button className="mt-4 px-4 py-2 bg-retail-blue/90 hover:bg-retail-blue text-white rounded-lg transition-colors flex items-center space-x-2">
          <Upload size={16} />
          <span>Select {type === 'video' ? 'Video' : 'Layout'}</span>
        </button>
      </div>
    </div>
  );
};

export default UploadZone;
