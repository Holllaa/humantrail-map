
/**
 * Main application functionality
 */

// DOM elements
const videoInput = document.getElementById('video-input');
const uploadZone = document.getElementById('upload-zone');
const storeVideo = document.getElementById('store-video');
const trackingCanvas = document.getElementById('tracking-canvas');
const heatmapCanvas = document.getElementById('heatmap-canvas');
const playButton = document.getElementById('play-button');
const processButton = document.getElementById('process-button');
const trackingTab = document.getElementById('tracking-tab');
const heatmapTab = document.getElementById('heatmap-tab');
const floorMapTab = document.getElementById('floor-map-tab');
const trackingView = document.getElementById('tracking-view');
const heatmapView = document.getElementById('heatmap-view');
const floorMapView = document.getElementById('floor-map-view');
const totalVisitorsElement = document.getElementById('total-visitors');
const avgTimeElement = document.getElementById('avg-time').querySelector('span');
const popularAreasElement = document.getElementById('popular-areas');
const peakHoursElement = document.getElementById('peak-hours');

// Application state
let videoLoaded = false;
let isProcessing = false;
let heatmapData = [];
let mappedTrackingData = [];

// Initialize application
function init() {
  // Set up event listeners
  videoInput.addEventListener('change', handleVideoUpload);
  uploadZone.addEventListener('dragover', handleDragOver);
  uploadZone.addEventListener('drop', handleDrop);
  playButton.addEventListener('click', toggleVideoPlayback);
  processButton.addEventListener('click', processVideo);
  trackingTab.addEventListener('click', () => switchTab('tracking'));
  heatmapTab.addEventListener('click', () => switchTab('heatmap'));
  floorMapTab.addEventListener('click', () => switchTab('floor-map'));
  
  // Initial tab setup
  switchTab('tracking');
  
  // Video event listeners
  storeVideo.addEventListener('loadedmetadata', handleVideoLoaded);
  storeVideo.addEventListener('play', handleVideoPlay);
  storeVideo.addEventListener('pause', handleVideoPause);
  storeVideo.addEventListener('ended', handleVideoEnded);
  
  // Initialize floor map
  initFloorMap();
  
  // Load tracking model
  loadTrackingModel().catch(error => {
    console.error("Failed to load tracking model:", error);
  });
  
  // Resize observer for canvas sizing
  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      if (entry.target === trackingView) {
        resizeCanvases();
      }
    }
  });
  
  resizeObserver.observe(trackingView);
}

// Handle video file upload
function handleVideoUpload(e) {
  const file = e.target.files[0];
  if (file && file.type.includes('video/')) {
    const videoURL = URL.createObjectURL(file);
    storeVideo.src = videoURL;
    updateUploadZoneState('uploaded');
  }
}

// Handle drag over event
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  uploadZone.classList.add('drag-over');
}

// Handle drop event
function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  uploadZone.classList.remove('drag-over');
  
  const file = e.dataTransfer.files[0];
  if (file && file.type.includes('video/')) {
    videoInput.files = e.dataTransfer.files;
    const event = new Event('change');
    videoInput.dispatchEvent(event);
  }
}

// Handle video loaded
function handleVideoLoaded() {
  videoLoaded = true;
  processButton.disabled = false;
  
  // Set canvas dimensions to match video
  resizeCanvases();
}

// Resize canvases to match video dimensions
function resizeCanvases() {
  if (!videoLoaded) return;
  
  const videoWidth = storeVideo.videoWidth;
  const videoHeight = storeVideo.videoHeight;
  
  // Set tracking canvas size
  trackingCanvas.width = videoWidth;
  trackingCanvas.height = videoHeight;
  
  // Set heatmap canvas size
  heatmapCanvas.width = videoWidth;
  heatmapCanvas.height = videoHeight;
}

// Toggle video playback
function toggleVideoPlayback() {
  if (storeVideo.paused) {
    storeVideo.play();
    playButton.textContent = 'Pause';
  } else {
    storeVideo.pause();
    playButton.textContent = 'Play';
  }
}

// Handle video play event
function handleVideoPlay() {
  playButton.textContent = 'Pause';
}

// Handle video pause event
function handleVideoPause() {
  playButton.textContent = 'Play';
}

// Handle video ended event
function handleVideoEnded() {
  playButton.textContent = 'Replay';
}

// Process video to generate tracking data
function processVideo() {
  if (!videoLoaded || isProcessing) return;
  
  isProcessing = true;
  processButton.disabled = true;
  processButton.textContent = 'Processing...';
  
  // Reset tracking data
  resetTracking();
  
  // Start tracking
  startTracking(storeVideo, trackingCanvas);
  
  // Start video if not playing
  if (storeVideo.paused) {
    storeVideo.play();
  }
  
  // Process for a short time for demo
  setTimeout(() => {
    // Generate heatmap from tracking data
    heatmapData = generateHeatmapFromTracks(
      personTrackingData, 
      trackingCanvas.width, 
      trackingCanvas.height
    );
    
    // Draw heatmap
    drawHeatmap(
      heatmapCanvas.getContext('2d'), 
      heatmapData, 
      heatmapCanvas.width, 
      heatmapCanvas.height
    );
    
    // Map tracking data to floor map
    mappedTrackingData = mapTrackingToFloorMap(personTrackingData);
    
    // Draw on floor map
    drawTrackingOnFloorMap(mappedTrackingData);
    
    // Update analytics
    updateAnalytics();
    
    isProcessing = false;
    processButton.textContent = 'Processed';
  }, 5000);
}

// Update analytics panel
function updateAnalytics() {
  const analytics = calculateAnalytics();
  
  totalVisitorsElement.textContent = analytics.totalVisitors;
  avgTimeElement.textContent = analytics.averageTimeSeconds;
  popularAreasElement.textContent = analytics.popularAreas;
  peakHoursElement.textContent = analytics.peakHours;
}

// Switch between tabs
function switchTab(tabName) {
  // Update tab buttons
  trackingTab.classList.toggle('active', tabName === 'tracking');
  heatmapTab.classList.toggle('active', tabName === 'heatmap');
  floorMapTab.classList.toggle('active', tabName === 'floor-map');
  
  // Update views
  trackingView.classList.toggle('active', tabName === 'tracking');
  heatmapView.classList.toggle('active', tabName === 'heatmap');
  floorMapView.classList.toggle('active', tabName === 'floor-map');
  
  // Redraw visualizations based on active tab
  if (tabName === 'tracking' && personTrackingData.length > 0) {
    // Handled by animation loop
  } else if (tabName === 'heatmap' && heatmapData.length > 0) {
    drawHeatmap(
      heatmapCanvas.getContext('2d'), 
      heatmapData, 
      heatmapCanvas.width, 
      heatmapCanvas.height
    );
  } else if (tabName === 'floor-map' && mappedTrackingData.length > 0) {
    // Toggle between tracking and heatmap views on floor map
    if (document.querySelector('.floor-map-controls .view-toggle')) {
      // If toggle exists, check its state
      const showHeatmap = document.querySelector('.floor-map-controls .view-toggle').classList.contains('heatmap-active');
      if (showHeatmap) {
        drawHeatmapOnFloorMap(mappedTrackingData);
      } else {
        drawTrackingOnFloorMap(mappedTrackingData);
      }
    } else {
      // Default to tracking view
      drawTrackingOnFloorMap(mappedTrackingData);
      
      // Add toggle button
      const toggleButton = document.createElement('button');
      toggleButton.textContent = 'Show Heatmap';
      toggleButton.className = 'view-toggle';
      document.querySelector('.floor-map-controls').appendChild(toggleButton);
      
      toggleButton.addEventListener('click', () => {
        toggleButton.classList.toggle('heatmap-active');
        if (toggleButton.classList.contains('heatmap-active')) {
          toggleButton.textContent = 'Show Tracks';
          drawHeatmapOnFloorMap(mappedTrackingData);
        } else {
          toggleButton.textContent = 'Show Heatmap';
          drawTrackingOnFloorMap(mappedTrackingData);
        }
      });
    }
  }
}

// Update upload zone visual state
function updateUploadZoneState(state) {
  uploadZone.classList.remove('drag-over', 'uploaded', 'processing');
  
  if (state) {
    uploadZone.classList.add(state);
  }
}

// Create a placeholder floor map
function createPlaceholderFloorMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  
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

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Create placeholder floor map
  const placeholderSrc = createPlaceholderFloorMap();
  const floorMapImg = document.getElementById('floor-map-img');
  floorMapImg.src = placeholderSrc;
  
  // Initialize app
  init();
});
