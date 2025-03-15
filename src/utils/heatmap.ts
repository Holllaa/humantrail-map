
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
