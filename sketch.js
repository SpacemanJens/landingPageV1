// ======== Constants ========
const CIRCLE_RADIUS = 400;
const IMAGE_SIZE = 120;
const ANIMATION_FRAMES = 180; // 3 seconds at 60fps
const SUPERNOVA_MAX_SIZE = 10001;
const SUPERNOVA_THRESHOLD = 0.7;

// ======== Global Variables ========
// UI elements
let gameImages = [];
let spacecraftImages = [];
let linkInput;
let hoveredImageIndex = -1;
let enlargedImageFade = 0; // Value from 0 to 1 for fade opacity

// Game state
let roomLink = "";
let copied = false;
let isFlying = false;
let flashEffect = 0; // Flash effect for visual feedback

// Scene elements
let stars = [];
let decorativeStars = [];
let allSpacecraft = []; // Array to store all spacecraft objects
let targetStar;

// ======== Classes ========
class Spacecraft {
  constructor(x, y, size, imageIndex) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.imageIndex = imageIndex;
  }
}

class Star {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  drawStarEffect(x, y, hsb2, hsb3, hsb4, hsb5, fill1, fill2, fill3, fill4, cr, coronaEffect) {
    // Apply supernova effect parameters if active
    if (coronaEffect !== 1) {
      fill1 = 50;
      fill2 = 550;
      fill3 = 300;
      fill4 = 400;
    }

    push();
    blendMode(BLEND);
    colorMode(HSB, hsb2, hsb3, hsb4, hsb5);
    blendMode(ADD);
    for (let d = 0; d < 1; d += 0.01) {
      fill(fill1, fill2, fill3, (1.1 - d * 1.2) * fill4);
      circle(x, y, cr * d + random(0, coronaEffect));
    }
    pop();
  }
}

class YellowStar extends Star {
  constructor(x, y) {
    super(x, y);
    this.isButtonHovered = false;
    this.crSize = random(30, 60);
    this.maxSize = random(15, 30); // Different max sizes for variety
    this.animationSpeed = random(0.01, 0.03);
    this.size = random(8, 15); // For collision detection
  }

  draw() {
    // Animate cr size smoothly when button is hovered
    this.crSize = lerp(
      this.crSize, 
      this.isButtonHovered ? this.maxSize : 4, 
      this.animationSpeed
    );

    // Draw the star effect
    this.drawStarEffect(this.x, this.y, 430, 800, 1500, 1010, 50, 550, 300, 400, this.crSize, 1);
  }

  setButtonHovered(isHovered) {
    this.isButtonHovered = isHovered;
  }
}

class DecorativeStar extends YellowStar {
  constructor(x, y) {
    super(x, y);
    this.initStarParameters();
    this.setupSupernovaProperties();
  }

  initStarParameters() {
    // Choose star type based on random value
    const randomValue = random(1);
    let params;
    
    if (randomValue > 0.9) {
      params = { hsb2: 0, hsb3: 0, hsb4: 0, hsb5: 10000, fill1: 50, fill2: 550, fill3: 300, fill4: 400, sizeFactor: random(1, 1.5) };  // red
    } else if (randomValue > 0.8) {
      params = { hsb2: 600, hsb3: 645, hsb4: 2000, hsb5: 1010, fill1: 550, fill2: 550, fill3: 300, fill4: 400, sizeFactor: random(0.8, 1.5) }; // pink
    } else if (randomValue > 0.7) {
      params = { hsb2: 71, hsb3: 645, hsb4: 2000, hsb5: 1010, fill1: 50, fill2: 550, fill3: 300, fill4: 400, sizeFactor: random(1, 1.5) };  //blue
    } else if (randomValue > 0.6) {
      params = { hsb2: 87, hsb3: 645, hsb4: 2000, hsb5: 1010, fill1: 50, fill2: 550, fill3: 300, fill4: 400, sizeFactor: random(0.8, 1.5) };  // light blue
    } else if (randomValue > 0.5) {
      params = { hsb2: 160, hsb3: 645, hsb4: 2000, hsb5: 1010, fill1: 50, fill2: 550, fill3: 300, fill4: 400, sizeFactor: random(0.8, 1.5) }; // green
    } else if (randomValue > 0.4) {
      params = { hsb2: 65, hsb3: 0, hsb4: 65, hsb5: 300, fill1: 50, fill2: 122, fill3: 500, fill4: 56, sizeFactor: random(0.8, 1.5) }; // Purple giant
    } else if (randomValue > 0.3) {
      params = { hsb2: 181, hsb3: 181, hsb4: 2000, hsb5: 300, fill1: 50, fill2: 122, fill3: 500, fill4: 181, sizeFactor: random(0.8, 1.5) }; // Green giant
    } else {
      params = { hsb2: 1600, hsb3: 645, hsb4: 2000, hsb5: 1010, fill1: 50, fill2: 1600, fill3: 1600, fill4: 400, sizeFactor: random(0.5, 5.5) }; // Red giant
    }
    
    // Assign parameters to this star
    Object.assign(this, params);
  }

  setupSupernovaProperties() {
    this.isSupernova = false;
    this.supernovaStartFrame = 0;
    this.supernovaDuration = ANIMATION_FRAMES;
    this.disappearThreshold = SUPERNOVA_THRESHOLD;
    this.isDead = false;
    this.supernovaMaxSize = SUPERNOVA_MAX_SIZE;
  }

  draw() {
    // If star is dead (post-supernova), don't draw it
    if (this.isDead) return;

    if (this.isSupernova) {
      this.drawSupernova();
    } else {
      this.drawNormalStar();
    }
  }

  drawSupernova() {
    // Calculate progress of supernova animation
    const progress = (frameCount - this.supernovaStartFrame) / this.supernovaDuration;
    const normalizedProgress = progress / this.disappearThreshold;

    // Growth calculation
    const growthFactor = pow(normalizedProgress, 12.2);
    const currentSize = lerp(this.crSize, this.supernovaMaxSize, growthFactor);

    // Disappear when reaching max size
    if (currentSize >= this.supernovaMaxSize / 4) {
      flashEffect = 60;
      this.isDead = true;
      return;
    }

    // Calculate fade effect
    const fadeFactor = this.calculateFadeFactor(normalizedProgress);
    const currentFill1 = lerp(this.fill1, 0, fadeFactor);
    const currentFill2 = lerp(this.fill2, 0, fadeFactor);

    // Draw with supernova effect
    this.drawStarEffect(
      this.x, this.y,
      this.hsb2, this.hsb3, this.hsb4, this.hsb5,
      currentFill1, currentFill2,
      this.fill3 * (1 - fadeFactor * 0.7), 
      this.fill4 * (1 + normalizedProgress * 2.5 - fadeFactor),
      currentSize,
      6 * normalizedProgress
    );
  }

  calculateFadeFactor(progress) {
    // Start fading at 30% progress, complete by 70%
    const rawFade = constrain(map(progress, 0.3, 0.7, 0, 1), 0, 1);
    // Apply non-linear fade curve
    return pow(rawFade, 0.7);
  }

  drawNormalStar() {
    if (this.isButtonHovered) {
      this.crSize = lerp(this.crSize, this.maxSize, this.animationSpeed);
    } else {
      this.crSize = lerp(this.crSize, 4, this.animationSpeed);
    }

    this.drawStarEffect(
      this.x, this.y,
      this.hsb2, this.hsb3, this.hsb4, this.hsb5,
      this.fill1, this.fill2, this.fill3, this.fill4,
      this.crSize, 1
    );
  }

  triggerSupernova() {
    if (!this.isDead && !this.isSupernova) {
      this.isSupernova = true;
      this.supernovaStartFrame = frameCount;
    }
  }
}

// ======== Setup Functions ========
function preload() {
  loadGameImages();
  loadSpacecraftImages();
}

function loadGameImages() {
  const imagePaths = [
    "images/hangerTeamGreen.png", "images/planet1p1.png", "images/planet1p2.png",
    "images/planet1p3.png", "images/planet2p1.png", "images/planet2p2.png",
    "images/planet3p1.png", "images/planet3p2.png", "images/planet3p3.png",
    "images/planet3p4.png", "images/hangerTeamBlue.png", "images/planet4p1.png",
    "images/planet4p2.png", "images/planet4p3.png", "images/planet4p4.png",
    "images/logo.png", "images/planet0p1.png", "images/planet0p2.png",
    "images/planet0p3.png", "images/planet0p4.png"
  ];
  
  imagePaths.forEach(path => gameImages.push(loadImage(path)));
}

function loadSpacecraftImages() {
  for (let i = 1; i <= 20; i++) {
    spacecraftImages.push(loadImage(`images/spaceCraft${i}.png`));
  }
}

function setup() {
  createCanvas(2200, 1150);
  textAlign(CENTER, CENTER);
  
  // Create scene elements
  createBackgroundStars();
  targetStar = new YellowStar(1300, 300);
  createDecorativeStars();
  setupLinkInput();
}

function createBackgroundStars() {
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      twinkle: random(0.01, 0.05)
    });
  }
}

function createDecorativeStars() {
  const imagePositions = calculateImagePositions();
  const enlargedRect = calculateEnlargedImageRect();
  
  for (let i = 0; i < 20; i++) {
    // Find valid position for the star
    const position = findValidStarPosition(imagePositions, enlargedRect);
    decorativeStars.push(new DecorativeStar(position.x, position.y));
  }
}

function calculateImagePositions() {
  const positions = [];
  const centerX = 100 + CIRCLE_RADIUS;
  const centerY = 100 + CIRCLE_RADIUS;
  const extraSize = 140; // Slightly larger for collision detection
  
  for (let i = 0; i < gameImages.length; i++) {
    const angle = i * (TWO_PI / Math.max(4, gameImages.length));
    const x = centerX + CIRCLE_RADIUS * cos(angle);
    const y = centerY + CIRCLE_RADIUS * sin(angle);
    positions.push({
      x, y,
      radius: extraSize / 1.5
    });
  }
  
  return positions;
}

function calculateEnlargedImageRect() {
  const circleRightEdge = 100 + CIRCLE_RADIUS * 2 + 150;
  const enlargedSize = 840;
  const x = circleRightEdge;
  const y = height / 2 - enlargedSize / 2 - 100;
  
  return {
    left: x - 20,
    top: y - 20,
    right: x + enlargedSize + 20,
    bottom: y + enlargedSize + 60
  };
}

function findValidStarPosition(imagePositions, enlargedRect) {
  let x, y;
  let validPosition = false;
  
  while (!validPosition) {
    x = random(200, width - 200);
    y = random(100, height - 100);
    validPosition = true;
    
    // Check against image positions
    for (const pos of imagePositions) {
      if (dist(x, y, pos.x, pos.y) < pos.radius) {
        validPosition = false;
        break;
      }
    }
    
    // Check against enlarged image area
    if (validPosition && 
        x >= enlargedRect.left && x <= enlargedRect.right &&
        y >= enlargedRect.top && y <= enlargedRect.bottom) {
      validPosition = false;
    }
  }
  
  return {x, y};
}

function setupLinkInput() {
  linkInput = createElement('input');
  linkInput.position(100, -50); // Off-screen initially
  linkInput.attribute('readonly', true);
  linkInput.style('font-size', '16px');
  linkInput.style('width', '300px');
  linkInput.style('background-color', 'rgba(40, 60, 100, 0.8)');
  linkInput.style('color', 'rgb(100, 255, 100)');
  linkInput.style('border', '1px solid rgb(80, 120, 255)');
  linkInput.style('border-radius', '5px');
  linkInput.style('padding', '5px');
}

// ======== Draw Functions ========
function draw() {
  // Dark space background
  background(10, 15, 30);

  // Draw scene elements
  drawStars();
  targetStar.draw();
  decorativeStars.forEach(star => star.draw());

  // Draw spacecraft if active
  if (isFlying) {
    drawAllSpacecraft();
  }

  // Draw UI elements
  drawRulesSection();
  drawGameImages();
  drawEnlargedImage();
  drawGameButton();

  // Add flash effect on top of everything if active
  if (flashEffect > 0) {
    fill(255, 255, 255, flashEffect * 8);
    rectMode(CORNER);
    rect(0, 0, width, height);
    flashEffect--;
  }
}

function drawStars() {
  fill(255);
  noStroke();
  stars.forEach(star => {
    const brightness = 150 + 105 * sin(frameCount * star.twinkle);
    fill(brightness);
    ellipse(star.x, star.y, star.size);
  });
}

function drawRulesSection() {
  const centerX = 100 + CIRCLE_RADIUS;
  const centerY = 100 + CIRCLE_RADIUS;

  // Game title
  drawingContext.shadowBlur = 25;
  drawingContext.shadowColor = 'rgba(100, 200, 255, 0.9)';
  fill(100, 150, 255);
  textSize(40);
  textFont('Helvetica');
  text("SPACE STRATEGO", centerX, centerY - 240);
  drawingContext.shadowBlur = 0;

  // Game rules
  fill(200, 220, 255);
  textSize(15);
  
  const rules = "Space Stratego is the ultimate friday fun game where\n" +
    "two Squads can play against each other in the fight for the flag.\n" +
    "To win each Squad must have a Teams call or similar\n" +
    "so they can share knowledge and strategy doing the game.\n" +
    "It also makes it much more fun.\n" +
    "So please encourage each Squad to call each other in a group call.\n\n" +
    "There is no timer on the game, but after 10 minutes\n" +
    "more efficient weapons will start to emerge and that\n" +
    "will make it unlikely for the game to continue for long.\n" +
    "The number of characters are automatically adjusted\n" +
    "according to the number of players.\n" +
    "The optimal number of players are between 5 and 13 on each Squad.\n\n" +
    "Push the \"Start new game\" button to start a private game\n" +
    "and send the link to all the players.\n\n" +
    "Have fun. You will need it. (Game under development)";
    
  text(rules, centerX, centerY - 40);
}

function drawGameImages() {
  const centerX = 100 + CIRCLE_RADIUS;
  const centerY = 100 + CIRCLE_RADIUS;
  
  hoveredImageIndex = -1; // Reset hover state
  decorativeStars.forEach(star => star.setButtonHovered(false));

  for (let i = 0; i < gameImages.length; i++) {
    const angle = i * (TWO_PI / Math.max(4, gameImages.length));
    const x = centerX + CIRCLE_RADIUS * cos(angle) - IMAGE_SIZE / 2;
    const y = centerY + CIRCLE_RADIUS * sin(angle) - IMAGE_SIZE / 2;

    // Check if mouse is hovering over this image
    if (mouseX > x && mouseX < x + IMAGE_SIZE &&
        mouseY > y && mouseY < y + IMAGE_SIZE) {
      
      hoveredImageIndex = i;
      
      // Activate corresponding star
      if (i < decorativeStars.length) {
        decorativeStars[i].setButtonHovered(true);
      }

      // Enhanced glow for hovered image
      drawingContext.shadowBlur = 30;
      drawingContext.shadowColor = 'rgba(100, 200, 255, 0.8)';
    } else {
      // Regular glow
      drawingContext.shadowBlur = 20;
      drawingContext.shadowColor = 'rgba(50, 100, 255, 0.5)';
    }

    image(gameImages[i], x, y, IMAGE_SIZE, IMAGE_SIZE);
    drawingContext.shadowBlur = 0;
  }
}

function drawEnlargedImage() {
  // Handle fade animation
  if (hoveredImageIndex < 0 || hoveredImageIndex >= gameImages.length) {
    enlargedImageFade = max(0, enlargedImageFade - 0.08); // Fade out
    if (enlargedImageFade <= 0) return; // Nothing to draw
  } else {
    enlargedImageFade = min(1, enlargedImageFade + 0.1); // Fade in
  }
  
  if (enlargedImageFade > 0) {
    const circleRightEdge = 100 + CIRCLE_RADIUS * 2 + 150;
    const enlargedSize = 800;
    const x = circleRightEdge;
    const y = height / 2 - enlargedSize / 2 - 100;
    
    const fadeAlpha = 255 * enlargedImageFade;
    
    // Apply glow effect
    drawingContext.shadowBlur = 40 * enlargedImageFade;
    drawingContext.shadowColor = `rgba(100, 200, 255, ${0.7 * enlargedImageFade})`;
    
    // Draw background panel
    fill(20, 40, 80, 200 * enlargedImageFade);
    rectMode(CORNER);
    rect(x - 20, y - 20, enlargedSize + 40, enlargedSize + 40, 15);
    
    // Determine which image to display
    const imageIndex = hoveredImageIndex >= 0 ? 
      hoveredImageIndex : constrain(hoveredImageIndex, 0, gameImages.length - 1);
    
    // Draw image with fade effect
    tint(255, fadeAlpha);
    image(gameImages[imageIndex], x, y, enlargedSize, enlargedSize);
    noTint();
    
    // Draw image name caption
    fill(255, fadeAlpha);
    textSize(24);
    const imageName = extractImageName(imageIndex);
    text(imageName, x + enlargedSize / 2, y + enlargedSize + 30);
    
    drawingContext.shadowBlur = 0;
  }
}

function extractImageName(index) {
  const path = gameImages[index].src || "";
  const filename = path.split('/').pop();
  const name = filename.split('.')[0];
  
  // Format name (add spaces between camelCase and before numbers)
  return name.replace(/([A-Z])/g, ' $1')
            .replace(/([0-9])/g, ' $1')
            .trim()
            .charAt(0).toUpperCase() + name.slice(1);
}

function drawGameButton() {
  const buttonX = 100 + CIRCLE_RADIUS;
  const buttonY = 100 + CIRCLE_RADIUS + 170;
  const buttonW = 220;
  const buttonH = 50;

  // Detect hover regardless of button state
  const isButtonHovered = mouseX > buttonX - buttonW / 2 && mouseX < buttonX + buttonW / 2 &&
                         mouseY > buttonY - buttonH / 2 && mouseY < buttonY + buttonH / 2;
  
  // Update star hover state
  targetStar.setButtonHovered(isButtonHovered);
  
  // Visual appearance based on state
  if (isFlying) {
    fill(60, 70, 100); // Disabled state
    drawingContext.shadowBlur = 5;
    drawingContext.shadowColor = 'rgba(50, 50, 100, 0.3)';
  } else if (isButtonHovered) {
    fill(80, 120, 255); // Hovered state
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(100, 150, 255, 0.8)';
  } else {
    fill(40, 70, 180); // Normal state
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'rgba(50, 100, 255, 0.5)';
  }

  rectMode(CENTER);
  rect(buttonX, buttonY, buttonW, buttonH, 10);
  drawingContext.shadowBlur = 0;

  // Button text
  fill(isFlying ? 150 : 255);
  textSize(18);
  text("START NEW GAME", buttonX, buttonY);

  // Display link if copied
  if (copied) {
    drawCopiedLink(buttonX, buttonY);
  } else {
    linkInput.position(100, -50); // Hide when not needed
  }
}

function drawCopiedLink(buttonX, buttonY) {
  fill(100, 255, 100);
  textSize(16);
  text("Game room created!", buttonX, buttonY + 40);
  text("Link copied to clipboard:", buttonX, buttonY + 65);
  
  // Show and position link input
  const inputX = buttonX - 150;
  const inputY = buttonY + 90;
  linkInput.position(inputX, inputY);
  linkInput.value(roomLink);
}

function drawAllSpacecraft() {
  // Calculate animation progress
  const progress = constrain((frameCount - targetStar.startFrame) / targetStar.animationFrames, 0, 1);
  
  if (progress < 1) {
    for (let i = 0; i < allSpacecraft.length; i++) {
      const craft = allSpacecraft[i];
      
      // Calculate staggered start delay
      const delay = 0.2 * (i / allSpacecraft.length);
      const craftProgress = constrain((progress - delay) * (1 / (1 - delay)), 0, 1);
      
      if (craftProgress <= 0) continue; // Skip if not yet started
      
      // Calculate position and size
      const currentX = lerp(craft.x, targetStar.x, craftProgress);
      const currentY = lerp(craft.y, targetStar.y, craftProgress);
      const currentSize = lerp(craft.size, 1, craftProgress); // Shrink to 1px
      
      // Draw spacecraft
      const craftImage = spacecraftImages[craft.imageIndex];
      if (craftImage) {
        // Apply colored glow effect
        const hue = (craft.imageIndex * 15) % 360;
        drawingContext.shadowBlur = map(currentSize, 1, craft.size, 3, 10);
        drawingContext.shadowColor = `hsla(${hue}, 100%, 60%, 0.7)`;
        
        image(craftImage, currentX - currentSize/2, currentY - currentSize/2, 
              currentSize, currentSize);
              
        drawingContext.shadowBlur = 0;
      }
    }
  } else if (isFlying) {
    // Animation complete
    isFlying = false;
  }
}

// ======== Event Handlers ========
function mousePressed() {
  checkButtonClick();
  checkImageClicks();
}

function checkButtonClick() {
  const buttonX = 100 + CIRCLE_RADIUS;
  const buttonY = 100 + CIRCLE_RADIUS + 170;
  const buttonW = 220;
  const buttonH = 50;
  
  if (!isFlying &&
     mouseX > buttonX - buttonW/2 && mouseX < buttonX + buttonW/2 &&
     mouseY > buttonY - buttonH/2 && mouseY < buttonY + buttonH/2) {
    
    const randomNumber = Math.floor(Math.random() * 1000000) + 1;
    roomLink = `https://spacemanjens.github.io/spaceSV10/?room=${randomNumber}`;
    
    navigator.clipboard.writeText(roomLink).then(() => {
      copied = true;
      createSpacecraft();
      startAnimation();
    });
  }
}

function createSpacecraft() {
  allSpacecraft = [];
  const imageRadius = CIRCLE_RADIUS;
  const centerX = 100 + imageRadius;
  const centerY = 100 + imageRadius;
  
  for (let i = 0; i < gameImages.length; i++) {
    // Calculate position adjustments
    const xAdjustment = i > 0 ? 30 : 80;
    const yAdjustment = i > 0 ? 30 : 20;
    
    // Calculate image position
    const angle = i * (TWO_PI / Math.max(4, gameImages.length));
    const imageX = centerX + imageRadius * cos(angle) - IMAGE_SIZE/2 - xAdjustment;
    const imageY = centerY + imageRadius * sin(angle) - IMAGE_SIZE/2 - yAdjustment;
    
    // Create spacecraft below image
    const craftX = imageX + IMAGE_SIZE/2;
    const craftY = imageY + IMAGE_SIZE + 10;
    const craftSize = 70 + random(-10, 10);
    const imageIndex = i % spacecraftImages.length;
    
    allSpacecraft.push(new Spacecraft(craftX, craftY, craftSize, imageIndex));
  }
}

function startAnimation() {
  targetStar.startFrame = frameCount;
  targetStar.animationFrames = ANIMATION_FRAMES;
  isFlying = true;
}

function checkImageClicks() {
  const centerX = 100 + CIRCLE_RADIUS;
  const centerY = 100 + CIRCLE_RADIUS;
  
  for (let i = 0; i < gameImages.length; i++) {
    const angle = i * (TWO_PI / Math.max(4, gameImages.length));
    const x = centerX + CIRCLE_RADIUS * cos(angle) - IMAGE_SIZE/2;
    const y = centerY + CIRCLE_RADIUS * sin(angle) - IMAGE_SIZE/2;
    
    // Check if mouse is over this image
    if (mouseX > x && mouseX < x + IMAGE_SIZE &&
        mouseY > y && mouseY < y + IMAGE_SIZE) {
      
      // Trigger supernova for corresponding star
      if (i < decorativeStars.length) {
        decorativeStars[i].triggerSupernova();
      }
      break;
    }
  }
}