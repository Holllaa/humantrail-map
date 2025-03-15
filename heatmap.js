
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
function generateFloorMapHeatmap(trackingData, floorMapMatrix) {
  // This would use the floor map matrix to map tracking coordinates to floor map coordinates
  // For demonstration, we'll just use the same heatmap data but mapped to the floor map canvas
  return generateHeatmapFromTracks(trackingData, 1, 1, 0.05);
}
