
import { HeatmapData } from "@/context/AnalyticsContext";

// Define colors for different heat levels
const HEATMAP_COLORS = {
  low: 'rgba(90, 200, 250, 0.2)', // light blue
  medium: 'rgba(255, 214, 10, 0.4)', // yellow
  high: 'rgba(255, 69, 58, 0.6)', // red
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
    
    // Determine color based on value
    let color;
    if (point.value < 0.3) {
      color = HEATMAP_COLORS.low;
    } else if (point.value < 0.7) {
      color = HEATMAP_COLORS.medium;
    } else {
      color = HEATMAP_COLORS.high;
    }
    
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
};

// Generate a color based on heat value
export const getHeatColor = (value: number): string => {
  if (value < 0.3) return 'heatmap-low';
  if (value < 0.7) return 'heatmap-medium';
  return 'heatmap-high';
};

// For DOM-based heat visualization (alternative to canvas)
export const createHeatElements = (
  container: HTMLElement,
  data: HeatmapData[],
  radius: number = 30
): void => {
  // Clear existing elements
  container.innerHTML = '';
  
  // Create heat elements
  data.forEach(point => {
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = `${point.x - radius}px`;
    element.style.top = `${point.y - radius}px`;
    element.style.width = `${radius * 2}px`;
    element.style.height = `${radius * 2}px`;
    element.style.borderRadius = '50%';
    
    // Add appropriate class based on heat value
    element.classList.add(getHeatColor(point.value));
    
    container.appendChild(element);
  });
};

// Alternative approach using CSS variables for dynamic sizing
export const drawHeatmapWithCSS = (
  container: HTMLElement,
  data: HeatmapData[],
  maxRadius: number = 50
): void => {
  // Clear existing elements
  container.innerHTML = '';
  
  // Create heat elements
  data.forEach(point => {
    const element = document.createElement('div');
    const radius = Math.max(10, maxRadius * point.value);
    
    element.style.position = 'absolute';
    element.style.left = `${point.x - radius}px`;
    element.style.top = `${point.y - radius}px`;
    element.style.width = `${radius * 2}px`;
    element.style.height = `${radius * 2}px`;
    element.style.borderRadius = '50%';
    element.style.transform = 'translate(-50%, -50%)';
    
    // Add appropriate class based on heat value
    element.classList.add(getHeatColor(point.value));
    
    container.appendChild(element);
  });
};
