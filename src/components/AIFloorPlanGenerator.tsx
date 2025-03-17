
import React, { useEffect, useRef, useState } from 'react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { 
  detectFloorPlanFromFrame, 
  drawFloorPlan, 
  overlayHeatmapOnFloorPlan, 
  generateFloorPlanAnalytics 
} from '@/utils/heatmap';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type FloorPlanData = {
  walls: {x1: number, y1: number, x2: number, y2: number}[];
  doors: {x: number, y: number, width: number, height: number}[];
  objects: {type: string, x: number, y: number, width: number, height: number}[];
};

type AnalyticsData = {
  highTrafficAreas: number;
  avgDoorTraffic: number;
  insights: string[];
  recommendations: string[];
};

const AIFloorPlanGenerator: React.FC = () => {
  const { videoSrc, heatmapData, storeLayout, setStoreLayout } = useAnalytics();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [floorPlan, setFloorPlan] = useState<FloorPlanData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'floorplan' | 'heatmap'>('floorplan');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Set up video element when source changes
  useEffect(() => {
    if (!videoSrc) return;
    
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    videoElement.src = videoSrc;
    videoElement.onloadeddata = () => {
      if (canvasRef.current) {
        canvasRef.current.width = videoElement.videoWidth;
        canvasRef.current.height = videoElement.videoHeight;
        
        // Update store layout dimensions
        setStoreLayout({
          width: videoElement.videoWidth,
          height: videoElement.videoHeight
        });
      }
    };
  }, [videoSrc, setStoreLayout]);

  // Generate floor plan from video
  const handleGenerateFloorPlan = async () => {
    const videoElement = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!videoElement || !canvas) {
      toast.error('Video source not available');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast.error('Canvas context not available');
      return;
    }
    
    setIsGenerating(true);
    toast.loading('Analyzing video and generating floor plan...', { id: 'floor-plan' });
    
    try {
      // Seek to 2 seconds into the video for a good frame
      videoElement.currentTime = 2;
      
      // Wait for seek to complete
      await new Promise(resolve => {
        videoElement.onseeked = resolve;
      });
      
      // Detect floor plan from video frame
      const detectedFloorPlan = await detectFloorPlanFromFrame(videoElement, ctx);
      setFloorPlan(detectedFloorPlan);
      
      // Draw the floor plan
      drawFloorPlan(ctx, detectedFloorPlan, canvas.width, canvas.height);
      
      // Update store layout with generated floor plan
      const floorPlanDataURL = canvas.toDataURL('image/png');
      setStoreLayout({
        imageUrl: floorPlanDataURL,
        width: canvas.width,
        height: canvas.height,
        scale: 1
      });
      
      // Generate analytics
      if (heatmapData.length > 0) {
        const analyticsData = generateFloorPlanAnalytics(detectedFloorPlan, heatmapData);
        setAnalytics(analyticsData);
      }
      
      toast.success('Floor plan generated successfully!', { id: 'floor-plan' });
    } catch (error) {
      console.error('Error generating floor plan:', error);
      toast.error('Failed to generate floor plan', { id: 'floor-plan' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle between floor plan and heatmap view
  const handleViewChange = (value: string) => {
    const mode = value as 'floorplan' | 'heatmap';
    setViewMode(mode);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || !floorPlan) return;
    
    if (mode === 'floorplan') {
      drawFloorPlan(ctx, floorPlan, canvas.width, canvas.height);
    } else {
      overlayHeatmapOnFloorPlan(ctx, floorPlan, heatmapData, canvas.width, canvas.height);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">AI Floor Plan Generator</h3>
        
        <Button
          onClick={handleGenerateFloorPlan}
          disabled={!videoSrc || isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Floor Plan'}
        </Button>
      </div>
      
      {/* Hidden video element for processing */}
      <video 
        ref={videoRef} 
        className="hidden" 
        controls={false} 
        muted 
        crossOrigin="anonymous"
      />
      
      {floorPlan ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 glass-panel p-4 space-y-4 rounded-lg">
            <Tabs defaultValue="floorplan" onValueChange={handleViewChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="floorplan">Floor Plan</TabsTrigger>
                <TabsTrigger value="heatmap">Heatmap Overlay</TabsTrigger>
              </TabsList>
              
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-white shadow-md">
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-full object-contain" 
                />
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>Generated from video analysis</span>
                <span>{canvasRef.current?.width || 0} x {canvasRef.current?.height || 0}</span>
              </div>
            </Tabs>
          </div>
          
          <div className="glass-panel p-4 rounded-lg">
            <h4 className="text-md font-medium mb-4">Spatial Analytics</h4>
            
            {analytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Card className="p-3 text-center">
                    <div className="text-2xl font-bold">{analytics.highTrafficAreas}</div>
                    <div className="text-xs text-gray-500">High Traffic Areas</div>
                  </Card>
                  <Card className="p-3 text-center">
                    <div className="text-2xl font-bold">{(analytics.avgDoorTraffic * 100).toFixed(0)}%</div>
                    <div className="text-xs text-gray-500">Entry Flow Efficiency</div>
                  </Card>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-2">Key Insights</h5>
                  <ul className="space-y-1">
                    {analytics.insights.map((insight, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start">
                        <span className="mr-2 text-green-500">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-2">Recommendations</h5>
                  <ul className="space-y-1">
                    {analytics.recommendations.map((rec, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start">
                        <span className="mr-2 text-blue-500">→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                Process video data to generate analytics
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="aspect-video w-full rounded-lg bg-gray-100 dark:bg-gray-800 grid place-items-center">
          <div className="text-center text-gray-400 max-w-md p-4">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>Upload a video and click "Generate Floor Plan" to automatically analyze and create a floor plan with AI.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFloorPlanGenerator;
