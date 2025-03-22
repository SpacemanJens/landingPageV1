// ======== Constants ========
const CIRCLE_RADIUS = 400;
const IMAGE_SIZE = 120;
const ANIMATION_FRAMES = 180; // 3 seconds at 60fps
const SUPERNOVA_MAX_SIZE = 10001;
const SUPERNOVA_THRESHOLD = 0.7;

// ======== Global Variables ========
// Assets
// gameImages is removed from global scope and fully managed by GameImageManager
// linkInput is removed from global scope and now fully managed by UIManager

// Manager instances
let backgroundManager;
let spacecraftManager;
let rulesAndButtonManager;
let gameImageManager;
let imageIndex8Manager;
let imageIndex10Manager;
let imageIndex11Manager;
let imageIndex13Manager;
let imageIndex16Manager;

// ======== Setup Functions ========
function preload() {
  // Make sure these classes are defined before using them
  // Initialize manager instances first to avoid undefined references
  backgroundManager = new BackgroundManager();
  spacecraftManager = new SpacecraftManager();
  rulesAndButtonManager = new UIManager(); 
  imageIndex8Manager = new ImageIndex8Manager();
  imageIndex10Manager = new ImageIndex10Manager();
  imageIndex11Manager = new ImageIndex11Manager();
  imageIndex13Manager = new ImageIndex13Manager();
  imageIndex16Manager = new ImageIndex16Manager();
  gameImageManager = new GameImageManager();
  
  // Now load images for all managers  
  gameImageManager.loadImages();
  
  imageIndex8Manager.loadImages();
  imageIndex10Manager.loadImagesAndAddSpacecrafts();
  imageIndex11Manager.loadImages();
  imageIndex13Manager.loadImages();
  imageIndex16Manager.loadImages();
  
  spacecraftManager.loadImages();
}

function setup() {
  // Create canvas and set text alignment
  createCanvas(2200, 1150);
  textAlign(CENTER, CENTER);

  // Initialize background manager
  backgroundManager.initialize();
  rulesAndButtonManager = new UIManager();
}

// ======== Main Draw Loop ========
function draw() {
  // Clear canvas with dark space background
  background(10, 15, 30);

  // Draw background elements (stars, etc.)
  backgroundManager.drawBackground();

  // Update and draw spacecraft animation if active
  spacecraftManager.updateAnimation(backgroundManager.getTargetStar());

  // Draw UI elements
  rulesAndButtonManager.drawRulesSection();
  gameImageManager.drawGameImages();
  gameImageManager.drawEnlargedImage();
  rulesAndButtonManager.drawGameButton();
}

// ======== Event Handlers ========
function mousePressed() {
  rulesAndButtonManager.checkButtonClick();
  gameImageManager.checkImageClicks();
}