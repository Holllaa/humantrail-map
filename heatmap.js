
/**
 * Heatmap utilities for visualizing customer movement
 */

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
function getColorForValue(value) {
  // Find the highest threshold that's less than or equal to the value
  for (let i = HEATMAP_COLORS.length - 1; i >= 0; i--) {
    if (value >= HEATMAP_COLORS[i].threshold) {
      return HEATMAP_COLORS[i].color;
    }
  }
  return HEATMAP_COLORS[0].color;
}

// Draw heatmap on canvas
function drawHeatmap(ctx, data, width, height, radius = 30) {
  // Clear the canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw each heat point
  data.forEach(point => {
    const gradient = ctx.createRadialGradient(
      point.x * width, point.y * height, 0,
      point.x * width, point.y * height, radius
    );
    
    // Get color based on value
    const color = getColorForValue(point.value);
    
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x * width, point.y * height, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Generate heatmap data from tracks
function generateHeatmapFromTracks(trackingData, width, height, gridSize = 20) {
  // Create a grid to count visits in each cell
  const gridWidth = Math.ceil(width / gridSize);
  const gridHeight = Math.ceil(height / gridSize);
  const grid = Array(gridHeight).fill(0).map(() => Array(gridWidth).fill(0));

  // Count visits in each grid cell
  trackingData.forEach(track => {
    track.path.forEach(point => {
      const gridX = Math.floor(point.x * width / gridSize);
      const gridY = Math.floor(point.y * height / gridSize);
      
      // Ensure we're within grid bounds
      if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
        grid[gridY][gridX]++;
      }
    });
  });

  // Find max value for normalization
  let maxValue = 0;
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      maxValue = Math.max(maxValue, grid[y][x]);
    }
  }

  // Convert grid to heatmap data format
  const heatmapData = [];
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (grid[y][x] > 0) {
        heatmapData.push({
          // Convert grid position back to normalized coordinates
          x: (x * gridSize + gridSize / 2) / width,
          y: (y * gridSize + gridSize / 2) / height,
          value: maxValue > 0 ? grid[y][x] / maxValue : 0,
        });
      }
    }
  }

  return heatmapData;
}

// Generate a heatmap overlay for the floor map
function generateFloorMapHeatmap(trackingData, floorMapMatrix, floorMapWidth, floorMapHeight) {
  if (!trackingData || !trackingData.length || !floorMapMatrix) {
    return [];
  }
  
  // Create a grid for the floor map with the same dimensions as the matrix
  const gridWidth = floorMapMatrix[0].length;
  const gridHeight = floorMapMatrix.length;
  const grid = Array(gridHeight).fill(0).map(() => Array(gridWidth).fill(0));
  
  // Map tracking coordinates to floor map grid coordinates
  trackingData.forEach(track => {
    track.path.forEach(point => {
      // Convert normalized tracking coordinates to floor map grid coordinates
      const gridX = Math.floor(point.x * gridWidth);
      const gridY = Math.floor(point.y * gridHeight);
      
      // Ensure we're within bounds and only count visits in walkable areas
      if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
        if (floorMapMatrix[gridY][gridX] === 1) { // Only count walkable areas
          grid[gridY][gridX]++;
        }
      }
    });
  });
  
  // Find max visit count for normalization
  let maxCount = 0;
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      maxCount = Math.max(maxCount, grid[y][x]);
    }
  }
  
  // Convert grid to heatmap data format
  const heatmapData = [];
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (grid[y][x] > 0) {
        heatmapData.push({
          x: (x + 0.5) / gridWidth,  // Center of the grid cell, normalized
          y: (y + 0.5) / gridHeight, // Center of the grid cell, normalized
          value: maxCount > 0 ? grid[y][x] / maxCount : 0
        });
      }
    }
  }
  
  return heatmapData;
}

// Render heatmap with transparency on a floor plan image
function renderFloorMapHeatmap(ctx, heatmapData, width, height, radius = 20) {
  // Use drawHeatmap with floor map specific settings
  drawHeatmap(ctx, heatmapData, width, height, radius);
  
  // Optionally, we can add overlay blend mode for better visibility
  ctx.globalCompositeOperation = 'multiply';
}

// Convert tracking data to a format that can be used with the floor map
function convertTrackingDataToFloorMap(trackingData, floorMapMatrix) {
  if (!trackingData || !trackingData.length || !floorMapMatrix) {
    return [];
  }
  
  const gridWidth = floorMapMatrix[0].length;
  const gridHeight = floorMapMatrix.length;
  
  // Create a deep copy of tracking data and map to floor map coordinates
  const mappedData = JSON.parse(JSON.stringify(trackingData));
  
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

// Automatically generate a floor map matrix from an image
// This uses simple brightness-based analysis - in a real app, you'd use ML
function generateFloorMapMatrixFromImage(image, resolution = 20) {
  // Create a canvas to analyze the image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  
  // Draw image to canvas
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Create matrix with specified resolution
  const matrix = [];
  const cellWidth = canvas.width / resolution;
  const cellHeight = canvas.height / resolution;
  
  // For each cell in the matrix
  for (let y = 0; y < resolution; y++) {
    const row = [];
    for (let x = 0; x < resolution; x++) {
      // Calculate the average brightness of this cell
      let totalBrightness = 0;
      let samples = 0;
      
      // Define cell boundaries
      const startX = Math.floor(x * cellWidth);
      const endX = Math.floor((x + 1) * cellWidth);
      const startY = Math.floor(y * cellHeight);
      const endY = Math.floor((y + 1) * cellHeight);
      
      // Sample pixels within the cell
      for (let py = startY; py < endY; py += 2) {
        for (let px = startX; px < endX; px += 2) {
          // Get pixel index (RGBA, 4 bytes per pixel)
          const i = (py * canvas.width + px) * 4;
          
          // Calculate brightness (average of RGB)
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          
          totalBrightness += brightness;
          samples++;
        }
      }
      
      // Determine if cell is walkable based on brightness
      // Brighter areas are typically floors, darker areas are walls/shelves
      const avgBrightness = samples > 0 ? totalBrightness / samples : 0;
      
      // Using a threshold to determine walkable areas
      // 1 = walkable, 0 = obstacle
      row.push(avgBrightness > 120 ? 1 : 0);
    }
    matrix.push(row);
  }
  
  return matrix;
}
