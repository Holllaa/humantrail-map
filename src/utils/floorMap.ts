
/**
 * Floor Map Utilities for mapping customer movement to store layout
 */

import { drawHeatmap } from './heatmap';

export interface FloorMapMatrix {
  grid: number[][];
  width: number;
  height: number;
}

// Create a default floor map matrix
export function createDefaultFloorMapMatrix(): FloorMapMatrix {
  // Simple 10x10 grid representing store layout
  // 0 = wall/obstacle, 1 = walkable area
  const grid = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    [0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    [0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];
  
  return {
    grid,
    width: grid[0].length,
    height: grid.length
  };
}

// Draw the floor map matrix on canvas
export function drawFloorMapMatrix(ctx: CanvasRenderingContext2D, floorMapMatrix: FloorMapMatrix, width: number, height: number) {
  if (!floorMapMatrix) return;
  
  ctx.clearRect(0, 0, width, height);
  
  const cellWidth = width / floorMapMatrix.width;
  const cellHeight = height / floorMapMatrix.height;
  
  // Draw grid
  for (let y = 0; y < floorMapMatrix.height; y++) {
    for (let x = 0; x < floorMapMatrix.width; x++) {
      const cellValue = floorMapMatrix.grid[y][x];
      
      // Only draw obstacles with a semi-transparent overlay
      if (cellValue === 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(
          x * cellWidth, 
          y * cellHeight, 
          cellWidth, 
          cellHeight
        );
      }
    }
  }
}

// Generate a floor map matrix from an image
export function generateFloorMapMatrixFromImage(image: HTMLImageElement, resolution: number = 20): FloorMapMatrix {
  // Create a canvas to analyze the image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }
  
  // Set canvas size
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  
  // Draw image to canvas
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Create grid with specified resolution
  const grid: number[][] = Array(resolution).fill(0).map(() => Array(resolution).fill(0));
  
  // Analyze image to create the matrix
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      // Get average pixel value in this grid cell
      let totalBrightness = 0;
      let pixelCount = 0;
      
      const startX = Math.floor(x * canvas.width / resolution);
      const endX = Math.floor((x + 1) * canvas.width / resolution);
      const startY = Math.floor(y * canvas.height / resolution);
      const endY = Math.floor((y + 1) * canvas.height / resolution);
      
      // Sample pixels in this grid cell
      for (let py = startY; py < endY; py += 4) {
        for (let px = startX; px < endX; px += 4) {
          const i = (py * canvas.width + px) * 4;
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          totalBrightness += brightness;
          pixelCount++;
        }
      }
      
      // Calculate average brightness
      const avgBrightness = totalBrightness / (pixelCount || 1);
      
      // Threshold to determine if walkable (light) or obstacle (dark)
      grid[y][x] = avgBrightness > 100 ? 1 : 0;
    }
  }
  
  return {
    grid,
    width: resolution,
    height: resolution
  };
}

// Generate insights based on tracking data and floor map
export function generateFloorMapInsights(tracks: any[], floorMapMatrix: FloorMapMatrix) {
  if (!tracks || tracks.length === 0 || !floorMapMatrix) {
    return {
      highTrafficAreas: [],
      bottlenecks: [],
      suggestions: []
    };
  }
  
  // Simple insights generation
  const suggestions = [
    "Consider rearranging product displays in high traffic areas",
    "Optimize checkout location based on customer flow",
    "Ensure sufficient space in narrow passages",
    "Monitor traffic patterns over time to identify changes"
  ];
  
  return {
    highTrafficAreas: [], // Would be populated with actual data in a full implementation
    bottlenecks: [],      // Would be populated with actual data in a full implementation
    suggestions
  };
}

// Helper function to overlay a heatmap on a floor plan
export function overlayHeatmapOnFloorPlan(
  ctx: CanvasRenderingContext2D,
  heatmapData: Array<{x: number, y: number, value: number}>,
  floorPlanImg: HTMLImageElement,
  width: number,
  height: number
) {
  // First draw the floor plan
  ctx.globalAlpha = 0.7;
  ctx.drawImage(floorPlanImg, 0, 0, width, height);
  ctx.globalAlpha = 1.0;
  
  // Then overlay the heatmap with multiply blend mode
  ctx.globalCompositeOperation = 'multiply';
  drawHeatmap(ctx, heatmapData, width, height);
  ctx.globalCompositeOperation = 'source-over';
}
