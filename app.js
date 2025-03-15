
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
const trackingView = document.getElementById('tracking-view');
const heatmapView = document.getElementById('heatmap-view');
const totalVisitorsElement = document.getElementById('total-visitors');
const avgTimeElement = document.getElementById('avg-time').querySelector('span');
const popularAreasElement = document.getElementById('popular-areas');

// Application state
let tracks = [];
let heatmapData = [];
let isProcessing = false;
let videoLoaded = false;
let animationId = null;

// Canvas contexts
const trackingCtx = trackingCanvas.getContext('2d');
const heatmapCtx = heatmapCanvas.getContext('2d');

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
  
  // Initial tab setup
  switchTab('tracking');
  
  // Video event listeners
  storeVideo.addEventListener('loadedmetadata', handleVideoLoaded);
  storeVideo.addEventListener('play', handleVideoPlay);
  storeVideo.addEventListener('pause', handleVideoPause);
  storeVideo.addEventListener('ended', handleVideoEnded);
  
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
  const containerWidth = trackingView.clientWidth;
  const containerHeight = (containerWidth / videoWidth) * videoHeight;
  
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
  
  // In a real app, we would do computer vision processing here
  // For demo purposes, generate random tracking data
  setTimeout(() => {
    const videoWidth = storeVideo.videoWidth;
    const videoHeight = storeVideo.videoHeight;
    
    // Generate demo data
    tracks = generateDemoData(videoWidth, videoHeight, 10, 100);
    
    // Generate heatmap data
    heatmapData = generateHeatmapFromTracks(tracks, videoWidth, videoHeight);
    
    // Draw initial visualization
    drawTracks(trackingCtx, tracks);
    drawHeatmap(heatmapCtx, heatmapData, videoWidth, videoHeight);
    
    // Update analytics
    updateAnalytics();
    
    isProcessing = false;
    processButton.textContent = 'Processed';
    
    // Start animation loop
    if (animationId === null) {
      animateTracking();
    }
  }, 2000);
}

// Update analytics panel
function updateAnalytics() {
  const analytics = calculateAnalytics(tracks);
  
  totalVisitorsElement.textContent = analytics.totalVisitors;
  avgTimeElement.textContent = analytics.averageTimeSeconds;
  popularAreasElement.textContent = analytics.popularAreas;
}

// Switch between tabs
function switchTab(tabName) {
  // Update tab buttons
  trackingTab.classList.toggle('active', tabName === 'tracking');
  heatmapTab.classList.toggle('active', tabName === 'heatmap');
  
  // Update views
  trackingView.classList.toggle('active', tabName === 'tracking');
  heatmapView.classList.toggle('active', tabName === 'heatmap');
  
  // Redraw visualizations based on active tab
  if (tabName === 'tracking' && tracks.length > 0) {
    drawTracks(trackingCtx, tracks);
  } else if (tabName === 'heatmap' && heatmapData.length > 0) {
    drawHeatmap(heatmapCtx, heatmapData, heatmapCanvas.width, heatmapCanvas.height);
  }
}

// Update upload zone visual state
function updateUploadZoneState(state) {
  uploadZone.classList.remove('drag-over', 'uploaded', 'processing');
  
  if (state) {
    uploadZone.classList.add(state);
  }
}

// Animate tracking visualization
function animateTracking() {
  // In a real app with real-time tracking, we would update tracks here
  // For demo, we'll just redraw without changes
  if (tracks.length > 0) {
    drawTracks(trackingCtx, tracks);
  }
  
  animationId = requestAnimationFrame(animateTracking);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
