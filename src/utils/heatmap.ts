
import { HeatmapData } from "@/context/AnalyticsContext";

// Define colors for different heat levels with gradient
const HEATMAP_COLORS = [
  { threshold: 0.0, color: 'rgba(173, 216, 230, 0.2)' }, // light blue - very low
  { threshold: 0.2, color: 'rgba(90, 200, 250, 0.3)' },  // blue - low
  { threshold: 0.4, color: 'rgba(60, 186, 146, 0.4)' },  // teal - medium-low
  { threshold: 0.6, color: 'rgba(255, 214, 10, 0.5)' },  // yellow - medium
  { threshold: 0.8, color: 'rgba(255, 149, 0, 0.6)' },   // orange - medium-high
  { threshold: 0.9, color: 'rgba(255, 69, 58, 0.7)' },   // red - high
];

// Get color based on value
const getColorForValue = (value: number): string => {
  // Find the highest threshold that's less than or equal to the value
  for (let i = HEATMAP_COLORS.length - 1; i >= 0; i--) {
    if (value >= HEATMAP_COLORS[i].threshold) {
      return HEATMAP_COLORS[i].color;
    }
  }
  return HEATMAP_COLORS[0].color;
};

// Draw heatmap on canvas
export const drawHeatmap = (
  ctx: CanvasRenderingContext2D,
  data: HeatmapData[],
  width: number,
  height: number,
  radius: number = 30
): void => {
  // Clear the canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw each heat point
  data.forEach(point => {
    const gradient = ctx.createRadialGradient(
      point.x, point.y, 0,
      point.x, point.y, radius
    );
    
    // Get color based on value
    const color = getColorForValue(point.value);
    
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
};

// Generate color based on heat value - for CSS class assignment
export const getHeatColor = (value: number): string => {
  if (value < 0.2) return 'heatmap-lowest';
  if (value < 0.4) return 'heatmap-low';
  if (value < 0.6) return 'heatmap-medium';
  if (value < 0.8) return 'heatmap-high';
  return 'heatmap-highest';
};

// Enhanced functions for AI-powered floor plan generation

// AI-based floor plan detection from video frame
export const detectFloorPlanFromFrame = async (
  videoElement: HTMLVideoElement, 
  ctx: CanvasRenderingContext2D
): Promise<{
  walls: {x1: number, y1: number, x2: number, y2: number}[],
  doors: {x: number, y: number, width: number, height: number}[],
  objects: {type: string, x: number, y: number, width: number, height: number}[]
}> => {
  // Create a temporary canvas to capture the video frame
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = videoElement.videoWidth;
  tempCanvas.height = videoElement.videoHeight;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) {
    throw new Error('Failed to get 2D context for temporary canvas');
  }
  
  // Draw the current video frame to the canvas
  tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
  
  // For simulation purposes, we'll generate a mock floor plan
  // In a real implementation, this would use computer vision ML models
  return simulateFloorPlanDetection(tempCanvas.width, tempCanvas.height);
};

// Mock implementation of floor plan detection
// This simulates what a real ML model would do
const simulateFloorPlanDetection = (width: number, height: number) => {
  // Create simulated walls around the perimeter with an opening for a door
  const walls = [
    // Top wall
    {x1: 0, y1: 0, x2: width, y2: 0},
    // Right wall
    {x1: width, y1: 0, x2: width, y2: height},
    // Bottom wall (with gap for door)
    {x1: 0, y1: height, x2: width/2 - 40, y2: height},
    {x1: width/2 + 40, y1: height, x2: width, y2: height},
    // Left wall
    {x1: 0, y1: 0, x2: 0, y2: height},
    
    // Interior walls/dividers
    {x1: width/3, y1: 0, x2: width/3, y2: height/2},
    {x1: width*2/3, y1: height/2, x2: width*2/3, y2: height},
    {x1: 0, y1: height/3, x2: width/3, y2: height/3}
  ];
  
  // Doors
  const doors = [
    {x: width/2 - 40, y: height - 10, width: 80, height: 10},
    {x: width/3 - 30, y: height/3 - 5, width: 60, height: 10}
  ];
  
  // Furniture and other objects
  const objects = [
    // Tables
    {type: 'table', x: width/6, y: height/6, width: 80, height: 80},
    {type: 'table', x: width/2, y: height/4, width: 100, height: 60},
    
    // Chairs
    {type: 'chair', x: width/6 - 20, y: height/6 - 20, width: 30, height: 30},
    {type: 'chair', x: width/6 + 70, y: height/6 + 20, width: 30, height: 30},
    {type: 'chair', x: width/2 - 20, y: height/4 - 30, width: 30, height: 30},
    {type: 'chair', x: width/2 + 90, y: height/4 + 10, width: 30, height: 30},
    
    // Shelves
    {type: 'shelf', x: 20, y: height/2 + 50, width: 120, height: 30},
    {type: 'shelf', x: width - 140, y: height/4, width: 120, height: 30},
    
    // Counter
    {type: 'counter', x: width*2/3 + 20, y: height - 100, width: 150, height: 40}
  ];
  
  return { walls, doors, objects };
};

// Draw the detected floor plan on a canvas
export const drawFloorPlan = (
  ctx: CanvasRenderingContext2D,
  floorPlan: {
    walls: {x1: number, y1: number, x2: number, y2: number}[],
    doors: {x: number, y: number, width: number, height: number}[],
    objects: {type: string, x: number, y: number, width: number, height: number}[]
  },
  width: number,
  height: number
): void => {
  // Clear the canvas
  ctx.clearRect(0, 0, width, height);
  
  // Fill background
  ctx.fillStyle = 'rgba(245, 245, 245, 0.8)';
  ctx.fillRect(0, 0, width, height);
  
  // Draw walls
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 4;
  floorPlan.walls.forEach(wall => {
    ctx.beginPath();
    ctx.moveTo(wall.x1, wall.y1);
    ctx.lineTo(wall.x2, wall.y2);
    ctx.stroke();
  });
  
  // Draw doors
  ctx.fillStyle = 'rgba(100, 149, 237, 0.7)';
  floorPlan.doors.forEach(door => {
    ctx.fillRect(door.x, door.y, door.width, door.height);
  });
  
  // Draw objects
  floorPlan.objects.forEach(obj => {
    switch(obj.type) {
      case 'table':
        ctx.fillStyle = 'rgba(160, 82, 45, 0.7)';
        break;
      case 'chair':
        ctx.fillStyle = 'rgba(139, 69, 19, 0.7)';
        break;
      case 'shelf':
        ctx.fillStyle = 'rgba(47, 79, 79, 0.7)';
        break;
      case 'counter':
        ctx.fillStyle = 'rgba(112, 128, 144, 0.7)';
        break;
      default:
        ctx.fillStyle = 'rgba(169, 169, 169, 0.7)';
    }
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
  });
  
  // Add a grid for better spatial understanding
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
  ctx.lineWidth = 1;
  
  // Horizontal grid lines
  for (let y = 0; y < height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Vertical grid lines
  for (let x = 0; x < width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
};

// Overlay heatmap on floor plan
export const overlayHeatmapOnFloorPlan = (
  ctx: CanvasRenderingContext2D,
  floorPlan: any,
  heatmapData: HeatmapData[],
  width: number,
  height: number
): void => {
  // First draw the floor plan
  drawFloorPlan(ctx, floorPlan, width, height);
  
  // Then overlay the heatmap with multiply blend mode
  ctx.globalCompositeOperation = 'multiply';
  drawHeatmap(ctx, heatmapData, width, height, 40);
  
  // Reset composite operation
  ctx.globalCompositeOperation = 'source-over';
};

// Generate analytics from floor plan and heatmap data
export const generateFloorPlanAnalytics = (
  floorPlan: any,
  heatmapData: HeatmapData[]
) => {
  // Identify high-traffic areas
  const highTrafficPoints = heatmapData.filter(point => point.value > 0.7);
  
  // Find which objects are in high-traffic areas
  const trafficHotspots = floorPlan.objects.filter(obj => {
    return highTrafficPoints.some(point => 
      point.x >= obj.x && 
      point.x <= obj.x + obj.width &&
      point.y >= obj.y && 
      point.y <= obj.y + obj.height
    );
  });
  
  // Calculate traffic flow efficiency
  const doorTraffic = heatmapData.filter(point => 
    floorPlan.doors.some(door => 
      point.x >= door.x && 
      point.x <= door.x + door.width &&
      point.y >= door.y && 
      point.y <= door.y + door.height
    )
  );
  
  const avgDoorTraffic = doorTraffic.reduce((sum, point) => sum + point.value, 0) / 
                         (doorTraffic.length || 1);
  
  // Generate insights
  return {
    highTrafficAreas: trafficHotspots.length,
    avgDoorTraffic: avgDoorTraffic,
    insights: [
      `Detected ${trafficHotspots.length} high-traffic areas around store fixtures`,
      `Door traffic efficiency: ${(avgDoorTraffic * 100).toFixed(1)}%`,
      `Identified ${floorPlan.objects.length} key fixtures in store layout`
    ],
    recommendations: [
      trafficHotspots.length > 2 ? 
        "Consider spreading high-traffic fixtures to improve customer flow" : 
        "Current fixture placement creates good traffic distribution",
      avgDoorTraffic > 0.7 ? 
        "Entry/exit points are efficiently placed" : 
        "Consider optimizing entry/exit point locations for better flow",
      "Analyze dwell time around key fixtures to optimize product placement"
    ]
  };
};
