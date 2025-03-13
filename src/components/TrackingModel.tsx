
import React, { useEffect, useState } from 'react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { toast } from 'sonner';
import { Download, RefreshCw, Share2 } from 'lucide-react';
import { generateDemoData, generateHeatmapFromTracks } from '@/utils/tracking';

const TrackingModel: React.FC = () => {
  const {
    isModelLoaded,
    setTracks,
    setIsModelLoaded,
    storeLayout,
    tracks,
    setHeatmapData,
  } = useAnalytics();
  
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  
  // Simulate model loading on component mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        // Simulate model loading time
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsModelLoaded(true);
        toast.success('Person tracking model loaded successfully');
      } catch (error) {
        console.error('Error loading model:', error);
        toast.error('Failed to load tracking model');
      }
    };
    
    loadModel();
  }, [setIsModelLoaded]);
  
  // Generate demo data for visualization
  const handleGenerateDemo = async () => {
    setIsGeneratingDemo(true);
    
    try {
      // Generate demo data with 15 people and 150 points per person
      const demoTracks = generateDemoData(
        storeLayout.width,
        storeLayout.height,
        15,
        150
      );
      
      // Set the tracks one by one with a small delay to simulate real-time processing
      let currentTracks = [];
      
      for (let i = 0; i < demoTracks.length; i++) {
        currentTracks.push(demoTracks[i]);
        setTracks([...currentTracks]);
        
        // Generate and update heatmap with each new track
        const heatmapData = generateHeatmapFromTracks(
          currentTracks,
          storeLayout.width,
          storeLayout.height
        );
        setHeatmapData(heatmapData);
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      toast.success('Demo data generated successfully');
    } catch (error) {
      console.error('Error generating demo data:', error);
      toast.error('Failed to generate demo data');
    } finally {
      setIsGeneratingDemo(false);
    }
  };
  
  // Export tracking data as JSON
  const handleExportData = () => {
    if (tracks.length === 0) {
      toast.error('No tracking data to export');
      return;
    }
    
    try {
      const dataStr = JSON.stringify(tracks, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportName = `retail-tracking-data-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportName);
      linkElement.click();
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };
  
  return (
    <div className="glass-panel p-4 space-y-4 w-full">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tracking Model</h3>
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${isModelLoaded ? 'bg-retail-green animate-pulse' : 'bg-retail-gray'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {isModelLoaded ? 'Model Ready' : 'Loading...'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleGenerateDemo}
          disabled={isGeneratingDemo || !isModelLoaded}
          className="px-4 py-2 bg-retail-blue text-white rounded-lg flex items-center justify-center space-x-2 hover:bg-retail-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingDemo ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          <span>Generate Demo Data</span>
        </button>
        
        <button
          onClick={handleExportData}
          disabled={tracks.length === 0}
          className="px-4 py-2 bg-retail-purple text-white rounded-lg flex items-center justify-center space-x-2 hover:bg-retail-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          <span>Export Data</span>
        </button>
        
        <button
          disabled={tracks.length === 0}
          className="px-4 py-2 bg-retail-teal text-white rounded-lg flex items-center justify-center space-x-2 hover:bg-retail-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Share2 size={16} />
          <span>Share Results</span>
        </button>
      </div>
      
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p>
          The tracking model uses computer vision to detect and track people in CCTV footage.
          For demonstration purposes, you can generate synthetic data to visualize the results.
        </p>
      </div>
    </div>
  );
};

export default TrackingModel;
