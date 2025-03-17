
import React, { useEffect, useRef, useState } from 'react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { drawHeatmap, overlayHeatmapOnFloorPlan } from '@/utils/heatmap';

const HeatmapView: React.FC = () => {
  const { heatmapData, storeLayout } = useAnalytics();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [floorPlanDetected, setFloorPlanDetected] = useState(false);
  
  // Draw the heatmap whenever data or layout changes
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = storeLayout.width;
    canvas.height = storeLayout.height;
    
    // Check if we have a floor plan image
    if (storeLayout.imageUrl) {
      setFloorPlanDetected(true);
      
      // Load the floor plan image
      const floorPlanImg = new Image();
      floorPlanImg.onload = () => {
        // Draw the floor plan image
        ctx.drawImage(floorPlanImg, 0, 0, canvas.width, canvas.height);
        
        // Overlay the heatmap if we have data
        if (heatmapData.length > 0) {
          // Use multiply blend mode for better overlay
          ctx.globalCompositeOperation = 'multiply';
          drawHeatmap(ctx, heatmapData, storeLayout.width, storeLayout.height);
          ctx.globalCompositeOperation = 'source-over';
        }
      };
      floorPlanImg.src = storeLayout.imageUrl;
    } else {
      setFloorPlanDetected(false);
      
      // Just draw the heatmap on a blank canvas
      if (heatmapData.length > 0) {
        drawHeatmap(ctx, heatmapData, storeLayout.width, storeLayout.height);
      } else {
        // Clear canvas if no data
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [heatmapData, storeLayout]);
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-lg bg-white/50 dark:bg-gray-800/50 shadow-subtle"
    >
      {/* No store layout message */}
      {!storeLayout.imageUrl && (
        <div className="absolute inset-0 grid place-items-center z-10">
          <p className="text-gray-400 dark:text-gray-600">No store layout detected or uploaded</p>
        </div>
      )}
      
      {/* No heatmap data message */}
      {heatmapData.length === 0 && (
        <div className="absolute inset-0 grid place-items-center z-20">
          <p className="text-gray-400 dark:text-gray-600">No movement data available</p>
        </div>
      )}
      
      {/* Heatmap canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full z-30"
      />
      
      {/* Legend */}
      {heatmapData.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-3 z-40 shadow-subtle border border-gray-100 dark:border-gray-700 flex flex-col space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Foot Traffic Density</p>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-heatmap-low/20" />
            <span className="text-xs text-gray-700 dark:text-gray-300">Very Low</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-heatmap-low/40" />
            <span className="text-xs text-gray-700 dark:text-gray-300">Low</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-heatmap-medium/50" />
            <span className="text-xs text-gray-700 dark:text-gray-300">Medium</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-heatmap-orange/60" />
            <span className="text-xs text-gray-700 dark:text-gray-300">High</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-heatmap-high/70" />
            <span className="text-xs text-gray-700 dark:text-gray-300">Very High</span>
          </div>
        </div>
      )}
      
      {/* AI Detection Badge */}
      {floorPlanDetected && storeLayout.imageUrl && (
        <div className="absolute top-4 left-4 bg-black/80 text-white text-xs font-medium py-1 px-2 rounded flex items-center z-40">
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI-Detected Floor Plan
        </div>
      )}
    </div>
  );
};

export default HeatmapView;
