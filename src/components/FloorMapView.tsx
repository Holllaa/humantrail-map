
import React, { useEffect, useRef, useState } from 'react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { createDefaultFloorMapMatrix, drawFloorMapMatrix, FloorMapMatrix, generateFloorMapInsights } from '@/utils/floorMap';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MapPin, ChevronsUpDown, LayoutDashboard } from 'lucide-react';

const FloorMapView: React.FC = () => {
  const { tracks, storeLayout } = useAnalytics();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [floorMapMatrix, setFloorMapMatrix] = useState<FloorMapMatrix | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  
  // Initialize floor map matrix
  useEffect(() => {
    setFloorMapMatrix(createDefaultFloorMapMatrix());
  }, []);
  
  // Draw floor map and tracks when data changes
  useEffect(() => {
    if (!canvasRef.current || !floorMapMatrix) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = storeLayout.width;
    canvas.height = storeLayout.height;
    
    // Draw the floor map matrix
    drawFloorMapMatrix(ctx, floorMapMatrix, canvas.width, canvas.height);
    
    // Draw customer tracks on the floor map
    if (tracks.length > 0) {
      ctx.strokeStyle = '#1a73e8';
      ctx.lineWidth = 2;
      
      tracks.forEach(track => {
        if (track.path.length < 2) return;
        
        ctx.beginPath();
        ctx.moveTo(track.path[0].x, track.path[0].y);
        
        for (let i = 1; i < track.path.length; i++) {
          ctx.lineTo(track.path[i].x, track.path[i].y);
        }
        
        ctx.stroke();
      });
    }
  }, [tracks, floorMapMatrix, storeLayout]);
  
  // Generate insights when tracks or floor map changes
  useEffect(() => {
    if (!floorMapMatrix || tracks.length === 0) return;
    
    const floorInsights = generateFloorMapInsights(tracks, floorMapMatrix);
    setInsights(floorInsights.suggestions);
  }, [tracks, floorMapMatrix]);
  
  // Handle auto-generation of floor map
  const handleAutoGenerate = () => {
    setFloorMapMatrix(createDefaultFloorMapMatrix());
    toast.success('Floor map generated successfully');
  };
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full rounded-lg overflow-hidden flex flex-col"
    >
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium">Floor Map Analysis</h3>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleAutoGenerate}
          className="flex gap-1 items-center"
        >
          <LayoutDashboard size={16} />
          Generate Floor Map
        </Button>
      </div>
      
      <div className="flex flex-1">
        <div className="w-2/3 relative">
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full"
          />
          
          {/* Empty state */}
          {(!tracks || tracks.length === 0) && (
            <div className="absolute inset-0 grid place-items-center">
              <p className="text-gray-400 dark:text-gray-600">No tracking data available</p>
            </div>
          )}
        </div>
        
        <div className="w-1/3 p-4 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="space-y-4">
            <h4 className="font-medium">Analysis Insights</h4>
            
            {insights.length > 0 ? (
              <ul className="list-disc list-inside space-y-2 text-sm">
                {insights.map((insight, i) => (
                  <li key={i}>{insight}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                No insights available. Process video with tracking data to generate insights.
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-subtle p-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-200 rounded-sm"></div>
          <span>Obstacles/Walls</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
          <span>Customer Path</span>
        </div>
      </div>
    </div>
  );
};

export default FloorMapView;
