/**
 * Floor Map Utilities for mapping customer movement to store layout
 */

// Types for floor map data
export type FloorMapMatrix = (0 | 1)[][];
export type Point = { x: number; y: number; timestamp?: number; walkable?: boolean };
export type Track = {
  id: string;
  active: boolean;
  path: Point[];
  floorMapPath?: Point[];
};
export type HeatmapPoint = { x: number; y: number; value: number };
export type HighTrafficArea = {
  center: { x: number; y: number };
  traffic: number;
  cells: { x: number; y: number }[];
};
export type Bottleneck = {
  position: { x: number; y: number };
  traffic: number;
  obstacleCount: number;
};

// Create a default floor map matrix
export function createDefaultFloorMapMatrix(): FloorMapMatrix {
  // Simple 10x10 grid representing store layout
  // 0 = wall/obstacle, 1 = walkable area
  return [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    [0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    [0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];
}

// Generate floor map matrix from image
export function generateFloorMapMatrixFromImage(
  image: HTMLImageElement,
  resolution = 20
): FloorMapMatrix {
  // Create a canvas to analyze the image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Set canvas size
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  
  // Draw image to canvas
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  
  // Create a grid for the store layout
  const gridWidth = resolution;
  const gridHeight = resolution;
  const floorMapMatrix: FloorMapMatrix = Array(gridHeight).fill(0).map(() => Array(gridWidth).fill(0)) as FloorMapMatrix;
  
  // Simple algorithm: for demo, assume light pixels are walkable areas
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      // Get average pixel value in this grid cell
      let totalBrightness = 0;
      let pixelCount = 0;
      
      const startX = Math.floor(x * canvas.width / gridWidth);
      const endX = Math.floor((x + 1) * canvas.width / gridWidth);
      const startY = Math.floor(y * canvas.height / gridHeight);
      const endY = Math.floor((y + 1) * canvas.height / gridHeight);
      
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
      const avgBrightness = totalBrightness / pixelCount;
      
      // Threshold to determine if walkable (light) or obstacle (dark)
      floorMapMatrix[y][x] = avgBrightness > 100 ? 1 : 0;
    }
  }
  
  return floorMapMatrix;
}

// Draw the floor map matrix on canvas
export function drawFloorMapMatrix(
  ctx: CanvasRenderingContext2D,
  floorMapMatrix: FloorMapMatrix,
  width: number,
  height: number
): void {
  if (!floorMapMatrix) return;
  
  ctx.clearRect(0, 0, width, height);
  
  const cellWidth = width / floorMapMatrix[0].length;
  const cellHeight = height / floorMapMatrix.length;
  
  // Draw grid
  for (let y = 0; y < floorMapMatrix.length; y++) {
    for (let x = 0; x < floorMapMatrix[0].length; x++) {
      const cellValue = floorMapMatrix[y][x];
      
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

// Create a placeholder floor map for testing
export function createPlaceholderFloorMap(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return '';
  }
  
  // Draw store layout
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, 800, 600);
  
  // Outer walls
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 4;
  ctx.strokeRect(50, 50, 700, 500);
  
  // Entrance
  ctx.fillStyle = '#1a73e8';
  ctx.fillRect(390, 550, 20, 4);
  ctx.fillStyle = '#666';
  ctx.font = '14px Arial';
  ctx.fillText('Entrance', 370, 580);
  
  // Shelves and display areas
  ctx.fillStyle = '#ccc';
  
  // Left shelves
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(100, 100 + i * 120, 150, 50);
  }
  
  // Right shelves
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(550, 100 + i * 120, 150, 50);
  }
  
  // Center display
  ctx.fillRect(325, 200, 150, 150);
  
  // Checkout area
  ctx.fillStyle = '#b3e5fc';
  ctx.fillRect(100, 480, 200, 40);
  ctx.fillStyle = '#666';
  ctx.fillText('Checkout', 170, 505);
  
  return canvas.toDataURL('image/jpeg');
}

// Convert tracking data to a format that can be used with the floor map
export function convertTrackingDataToFloorMap(
  trackingData: Track[],
  floorMapMatrix: FloorMapMatrix
): Track[] {
  if (!trackingData || !trackingData.length || !floorMapMatrix) {
    return [];
  }
  
  const gridWidth = floorMapMatrix[0].length;
  const gridHeight = floorMapMatrix.length;
  
  // Create a deep copy of tracking data and map to floor map coordinates
  const mappedData: Track[] = JSON.parse(JSON.stringify(trackingData));
  
  mappedData.forEach(track => {
    track.floorMapPath = track.path.map(point => {
      // Convert normalized video coordinates to floor map grid
      const gridX = Math.floor(point.x * gridWidth);
      const gridY = Math.floor(point.y * gridHeight);
      
      // Ensure coordinates are within bounds
      const boundedX = Math.max(0, Math.min(gridWidth - 1, gridX));
      const boundedY = Math.max(0, Math.min(gridHeight - 1, gridY));
      
      // Check if this position is walkable
      const isWalkable = floorMapMatrix[boundedY] && 
                         floorMapMatrix[boundedY][boundedX] === 1;
      
      // Return mapped point with additional walkable flag
      return {
        x: boundedX / gridWidth,
        y: boundedY / gridHeight,
        timestamp: point.timestamp,
        walkable: isWalkable
      };
    });
  });
  
  return mappedData;
}

// Draw tracking data on floor map
export function drawTrackingOnFloorMap(
  ctx: CanvasRenderingContext2D,
  mappedTrackingData: Track[],
  floorMapMatrix: FloorMapMatrix,
  width: number,
  height: number
): void {
  if (!mappedTrackingData || !mappedTrackingData.length) return;
  
  // Clear previous drawings but keep the floor map matrix visualization
  ctx.clearRect(0, 0, width, height);
  drawFloorMapMatrix(ctx, floorMapMatrix, width, height);
  
  // Draw each track
  mappedTrackingData.forEach(track => {
    if (!track.floorMapPath || track.floorMapPath.length < 2) return;
    
    // Draw path
    ctx.beginPath();
    ctx.moveTo(
      track.floorMapPath[0].x * width, 
      track.floorMapPath[0].y * height
    );
    
    for (let i = 1; i < track.floorMapPath.length; i++) {
      const point = track.floorMapPath[i];
      ctx.lineTo(
        point.x * width, 
        point.y * height
      );
    }
    
    ctx.strokeStyle = track.active ? '#1a73e8' : '#8e8e93';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw current position
    const lastPoint = track.floorMapPath[track.floorMapPath.length - 1];
    ctx.fillStyle = track.active ? '#1a73e8' : '#8e8e93';
    ctx.beginPath();
    ctx.arc(
      lastPoint.x * width, 
      lastPoint.y * height, 
      5, 0, Math.PI * 2
    );
    ctx.fill();
  });
}

// Generate heatmap data from tracking paths
export function generateHeatmapFromTracking(
  mappedTrackingData: Track[]
): HeatmapPoint[] {
  if (!mappedTrackingData || !mappedTrackingData.length) return [];
  
  // Generate heatmap data from floor map paths
  const points: Point[] = [];
  
  mappedTrackingData.forEach(track => {
    if (!track.floorMapPath) return;
    
    track.floorMapPath.forEach(point => {
      // Only add points in walkable areas
      if (point.walkable) {
        points.push({
          x: point.x,
          y: point.y
        });
      }
    });
  });
  
  // Normalize heatmap values by density
  const gridSize = 0.05; // 5% of floor map dimensions
  const gridWidth = Math.ceil(1 / gridSize);
  const gridHeight = Math.ceil(1 / gridSize);
  const grid = Array(gridHeight).fill(0).map(() => Array(gridWidth).fill(0));
  
  // Count points in each grid cell
  points.forEach(point => {
    const gridX = Math.floor(point.x / gridSize);
    const gridY = Math.floor(point.y / gridSize);
    
    if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
      grid[gridY][gridX]++;
    }
  });
  
  // Find max count for normalization
  let maxCount = 0;
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      maxCount = Math.max(maxCount, grid[y][x]);
    }
  }
  
  // Create normalized heatmap data
  const normalizedHeatmap: HeatmapPoint[] = [];
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (grid[y][x] > 0) {
        normalizedHeatmap.push({
          x: (x * gridSize) + (gridSize / 2),
          y: (y * gridSize) + (gridSize / 2),
          value: maxCount > 0 ? grid[y][x] / maxCount : 0
        });
      }
    }
  }
  
  return normalizedHeatmap;
}

// Draw heatmap on floor map
export function drawHeatmapOnFloorMap(
  ctx: CanvasRenderingContext2D,
  mappedTrackingData: Track[],
  floorMapMatrix: FloorMapMatrix,
  width: number,
  height: number
): void {
  if (!mappedTrackingData || !mappedTrackingData.length) return;
  
  // Clear canvas and redraw floor map matrix
  ctx.clearRect(0, 0, width, height);
  drawFloorMapMatrix(ctx, floorMapMatrix, width, height);
  
  // Generate heatmap data
  const heatmapData = generateHeatmapFromTracking(mappedTrackingData);
  
  // Import function from the heatmap utility
  import { drawHeatmap } from './heatmap';
  
  // Set global composite operation for better overlay
  ctx.globalCompositeOperation = 'multiply';
  
  // Draw the heatmap on the canvas
  drawHeatmap(ctx, heatmapData, width, height, 25);
  
  // Restore normal blend mode
  ctx.globalCompositeOperation = 'source-over';
}

// Identify high traffic areas in the floor map
export function identifyHighTrafficAreas(
  mappedTrackingData: Track[],
  floorMapMatrix: FloorMapMatrix
): HighTrafficArea[] {
  if (!floorMapMatrix || !mappedTrackingData.length) return [];
  
  const gridWidth = floorMapMatrix[0].length;
  const gridHeight = floorMapMatrix.length;
  const trafficGrid = Array(gridHeight).fill(0).map(() => Array(gridWidth).fill(0));
  
  // Count visits in each grid cell
  mappedTrackingData.forEach(track => {
    if (!track.floorMapPath) return;
    
    track.floorMapPath.forEach(point => {
      const gridX = Math.floor(point.x * gridWidth);
      const gridY = Math.floor(point.y * gridHeight);
      
      if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
        trafficGrid[gridY][gridX]++;
      }
    });
  });
  
  // Find average and max traffic
  let totalTraffic = 0;
  let maxTraffic = 0;
  let cellsWithTraffic = 0;
  
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (trafficGrid[y][x] > 0) {
        totalTraffic += trafficGrid[y][x];
        maxTraffic = Math.max(maxTraffic, trafficGrid[y][x]);
        cellsWithTraffic++;
      }
    }
  }
  
  const avgTraffic = cellsWithTraffic > 0 ? totalTraffic / cellsWithTraffic : 0;
  const highTrafficThreshold = avgTraffic * 1.5; // 50% above average
  
  // Identify high traffic areas (adjacent cells with high traffic)
  const highTrafficAreas: HighTrafficArea[] = [];
  const visited = Array(gridHeight).fill(false).map(() => Array(gridWidth).fill(false));
  
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (trafficGrid[y][x] > highTrafficThreshold && !visited[y][x]) {
        // Found a high traffic cell, expand to adjacent cells
        const area: HighTrafficArea = {
          center: { x, y },
          traffic: trafficGrid[y][x],
          cells: []
        };
        
        // Use flood fill to find adjacent high traffic cells
        const queue = [{ x, y }];
        visited[y][x] = true;
        
        while (queue.length > 0) {
          const cell = queue.shift()!;
          area.cells.push(cell);
          
          // Check adjacent cells
          const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
          ];
          
          for (const dir of directions) {
            const nx = cell.x + dir.dx;
            const ny = cell.y + dir.dy;
            
            if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight && 
                trafficGrid[ny][nx] > highTrafficThreshold && !visited[ny][nx]) {
              queue.push({ x: nx, y: ny });
              visited[ny][nx] = true;
            }
          }
        }
        
        // Only consider areas with multiple cells as significant
        if (area.cells.length >= 2) {
          highTrafficAreas.push(area);
        }
      }
    }
  }
  
  return highTrafficAreas;
}

// Identify potential bottlenecks in customer flow
export function identifyBottlenecks(
  mappedTrackingData: Track[],
  floorMapMatrix: FloorMapMatrix
): Bottleneck[] {
  if (!floorMapMatrix || !mappedTrackingData.length) return [];
  
  const gridWidth = floorMapMatrix[0].length;
  const gridHeight = floorMapMatrix.length;
  
  // Identify narrow passages by looking for walkable cells with obstacles on multiple sides
  const bottlenecks: Bottleneck[] = [];
  
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (floorMapMatrix[y][x] === 1) { // Walkable cell
        // Count adjacent obstacles
        let obstacleCount = 0;
        let adjacentWalkable = 0;
        
        // Check all 8 adjacent cells
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue; // Skip self
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
              if (floorMapMatrix[ny][nx] === 0) {
                obstacleCount++;
              } else {
                adjacentWalkable++;
              }
            } else {
              obstacleCount++; // Count out of bounds as obstacles
            }
          }
        }
        
        // A bottleneck is a walkable cell with many obstacles and few walkable neighbors
        if (obstacleCount >= 5 && adjacentWalkable <= 3) {
          // Check if this is a high traffic area
          let traffic = 0;
          mappedTrackingData.forEach(track => {
            if (!track.floorMapPath) return;
            
            track.floorMapPath.forEach(point => {
              const gridX = Math.floor(point.x * gridWidth);
              const gridY = Math.floor(point.y * gridHeight);
              
              if (gridX === x && gridY === y) {
                traffic++;
              }
            });
          });
          
          if (traffic > 0) {
            bottlenecks.push({
              position: { x, y },
              traffic: traffic,
              obstacleCount: obstacleCount
            });
          }
        }
      }
    }
  }
  
  return bottlenecks;
}

// Generate retail recommendations based on analysis
export function generateRecommendations(
  highTrafficAreas: HighTrafficArea[],
  bottlenecks: Bottleneck[]
): string[] {
  const recommendations: string[] = [];
  
  if (highTrafficAreas.length > 0) {
    recommendations.push('Consider placing high-margin products in high traffic areas for maximum visibility.');
    recommendations.push('Ensure sufficient space in high traffic areas to prevent congestion.');
  }
  
  if (bottlenecks.length > 0) {
    recommendations.push('Widen narrow passages where customer flow is restricted.');
    recommendations.push('Consider rearranging store fixtures to eliminate bottlenecks.');
  }
  
  if (highTrafficAreas.length === 0 && bottlenecks.length === 0) {
    recommendations.push('Your store layout appears to have good flow. Continue monitoring for changes.');
  }
  
  // Add general recommendations
  recommendations.push('Update floor plan analysis regularly as store layout changes.');
  
  return recommendations;
}

// Generate floor map insights
export function generateFloorMapInsights(
  mappedTrackingData: Track[],
  floorMapMatrix: FloorMapMatrix
) {
  if (!mappedTrackingData || !mappedTrackingData.length || !floorMapMatrix) {
    return {
      highTrafficAreas: [],
      bottlenecks: [],
      recommendations: []
    };
  }
  
  // Calculate high traffic areas
  const highTrafficAreas = identifyHighTrafficAreas(mappedTrackingData, floorMapMatrix);
  
  // Calculate bottlenecks
  const bottlenecks = identifyBottlenecks(mappedTrackingData, floorMapMatrix);
  
  // Generate recommendations
  const recommendations = generateRecommendations(highTrafficAreas, bottlenecks);
  
  return {
    highTrafficAreas,
    bottlenecks,
    recommendations
  };
}
