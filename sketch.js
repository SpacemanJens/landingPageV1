let gameImages = [];
let roomLink = "";
let copied = false;
let stars = [];
let hoveredImageIndex = -1;
let linkInput;
// Add spacecraft images array
let spacecraftImages = [];

// Modify spacecraft variables to handle multiple spacecraft
let isFlying = false;
let allSpacecraft = []; // Array to store all spacecraft objects

// Define a Spacecraft class to manage each instance
class Spacecraft {
  constructor(x, y, size, imageIndex) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.imageIndex = imageIndex; // Store which spacecraft image to use
  }
}

// Add array to hold additional stars
let decorativeStars = [];

class Star {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  drawStarEffect(x, y, hsb2, hsb3, hsb4, hsb5, fill1, fill2, fill3, fill4, cr, coronaEffect) {

    // if Supernova effect is active
    if (coronaEffect !== 1){
      fill1 = 50
      fill2 = 550
      fill3 = 300
      fill4 = 400
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
    // Give each star a slightly different starting size
    this.crSize = random(30, 60);
    this.maxSize = random(15, 30); // Different max sizes for variety
    this.animationSpeed = random(0.01, 0.03); // Different animation speeds
    this.size = random(8, 15); // For collision detection
  }

  draw() {
    // Animate cr size smoothly when button is hovered
    if (this.isButtonHovered) {
      this.crSize = lerp(this.crSize, this.maxSize, this.animationSpeed);
    } else {
      this.crSize = lerp(this.crSize, 4, this.animationSpeed);
    }
    //this.crSize = 100 JENS
    // Draw the star effect
        this.drawStarEffect(this.x, this.y, 430, 800, 1500, 1010, 50, 550, 300, 400, this.crSize, 1);
    //     this.drawStarEffect(this.x, this.y, 430, 800, 1500, 1010, mouseX, 550, 300, 400, this.crSize, 1);
  }

  // New method to update hover state
  setButtonHovered(isHovered) {
    this.isButtonHovered = isHovered;
  }
}

// Add supernova functionality to DecorativeStar class
class DecorativeStar extends YellowStar {
  constructor(x, y) {
    super(x, y);

    // Randomize HSB parameters
    this.hsb2 = random(1, 450);
    this.hsb3 = random(60, 1000);
    this.hsb4 = random(120, 1500);
    this.hsb5 = random(90, 1100);

    // Randomize fill parameters
    this.fill1 = random(7, 400);
    this.fill2 = random(50, 630); // random(500, 630);
    this.fill3 = random(25, 300); // random(250, 300);
    this.fill4 = random(25, 350); // random(250, 350);

    // Adjust supernova properties for slower effect but earlier disappearance
    this.isSupernova = false;
    this.supernovaStartFrame = 0;
    this.supernovaDuration = 180; // Increased from 120 to 180 (3 seconds at 60fps)
    this.disappearThreshold = 0.7; // Star will disappear at 70% of animation
    this.isDead = false;
    this.supernovaMaxSize = 7001;
  }

  draw() {
    // If star is dead (post-supernova), don't draw it
    if (this.isDead) return;

    if (this.isSupernova) {
      // Calculate progress of supernova animation
      let progress = (frameCount - this.supernovaStartFrame) / this.supernovaDuration;

      // Normalize progress to create smoother start
      let normalizedProgress = progress / this.disappearThreshold;

//      let growthFactor = pow(normalizedProgress, 2.2); // Adjusted for smoother growth
      // Even slower exponential growth curve with smoother beginning
      let growthFactor = pow(normalizedProgress, 12.2); // Adjusted for smoother growth
      let currentSize = lerp(this.crSize, this.supernovaMaxSize, growthFactor);

      // Disappear earlier in the animation to prevent overwhelming visuals
      //      if (progress >= this.disappearThreshold) {
      if (currentSize >= this.supernovaMaxSize - 1) {
        // Supernova animation has reached the disappearance threshold
        this.isDead = true;
        return;
      }

      // Draw with increasing brightness as it expands
      this.drawStarEffect(
        this.x, this.y,
        this.hsb2, this.hsb3, this.hsb4, this.hsb5,
        this.fill1, this.fill2, this.fill3,
        this.fill4 * (1 + normalizedProgress * 2.5), // Adjusted brightness increase
        currentSize,
        6 * normalizedProgress // Reduced corona effect for subtler expansion
      );
    } else {
      // Normal star animation (unchanged)
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
  }

  // Add method to trigger supernova
  triggerSupernova() {
    if (!this.isDead && !this.isSupernova) {
      this.isSupernova = true;
      this.supernovaStartFrame = frameCount;
    }
  }
}

function preload() {

  // Load the existing image
  gameImages.push(loadImage("images/hangerTeamGreen.png"));
  gameImages.push(loadImage("images/planet1p1.png"));
  gameImages.push(loadImage("images/planet1p2.png"));
  gameImages.push(loadImage("images/planet1p3.png"));
  gameImages.push(loadImage("images/planet2p1.png"));
  gameImages.push(loadImage("images/planet2p2.png"));
  gameImages.push(loadImage("images/planet3p1.png"));
  gameImages.push(loadImage("images/planet3p2.png"));
  gameImages.push(loadImage("images/planet3p3.png"));
  gameImages.push(loadImage("images/planet3p4.png"));
  gameImages.push(loadImage("images/hangerTeamBlue.png"));
  gameImages.push(loadImage("images/planet4p1.png"));
  gameImages.push(loadImage("images/planet4p2.png"));
  gameImages.push(loadImage("images/planet4p3.png"));
  gameImages.push(loadImage("images/planet4p4.png"));
  gameImages.push(loadImage("images/logo.png"));
  gameImages.push(loadImage("images/planet0p1.png"));
  gameImages.push(loadImage("images/planet0p2.png"));
  gameImages.push(loadImage("images/planet0p3.png"));
  gameImages.push(loadImage("images/planet0p4.png"));


  // Load all 20 spacecraft images
  for (let i = 1; i <= 20; i++) {
    spacecraftImages.push(loadImage(`images/spaceCraft${i}.png`));
  }
}

function setup() {
  createCanvas(2200, 1150);
  textAlign(CENTER, CENTER);

  // Create stars for the space background
  for (let i = 0; i < 300; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      twinkle: random(0.01, 0.05)
    });
  }

  targetStar = new YellowStar(1300, 300);

  // Calculate forbidden areas where stars shouldn't appear
  let imagePositions = [];

  // Calculate positions of all small circular images
  let radius = 400;
  let centerX = 100 + radius;
  let centerY = 100 + radius;
  let imgSize = 140; // Slightly larger to make sure stars don't touch the images

  // Add each small image's position and radius
  for (let i = 0; i < gameImages.length; i++) {
    let angle = i * (TWO_PI / Math.max(4, gameImages.length));
    let x = centerX + radius * cos(angle);
    let y = centerY + radius * sin(angle);
    imagePositions.push({
      x: x,
      y: y,
      radius: imgSize / 1.5  // Use radius slightly larger than image radius
    });
  }

  // Define enlarged image area as a rectangle to be more accurate
  let circleRightEdge = 100 + radius * 2 + 150;
  let enlargedSize = 840; // Slightly larger than the actual 800 for safety margin
  let enlargedX = circleRightEdge;
  let enlargedY = height / 2 - enlargedSize / 2 - 100;

  // Add forbidden rectangle for enlarged image area
  let enlargedRect = {
    left: enlargedX - 20, // Add padding for the background
    top: enlargedY - 20,
    right: enlargedX + enlargedSize + 20,
    bottom: enlargedY + enlargedSize + 60 // Extra space for caption
  };

  // Create 20 additional interactive stars with random colors
  for (let i = 0; i < 20; i++) {
    let starX, starY;
    let validPosition = false;

    // Keep generating positions until we find one not overlapping with any image
    while (!validPosition) {
      // Create stars at random positions, avoiding the very edges
      starX = random(200, width - 200);
      starY = random(100, height - 100);

      // Check against all image positions (circular)
      validPosition = true;
      for (let pos of imagePositions) {
        let distance = dist(starX, starY, pos.x, pos.y);
        if (distance < pos.radius) {
          validPosition = false;
          break;
        }
      }

      // Also check against enlarged image rectangle
      if (validPosition) {
        if (starX >= enlargedRect.left &&
          starX <= enlargedRect.right &&
          starY >= enlargedRect.top &&
          starY <= enlargedRect.bottom) {
          validPosition = false;
        }
      }
    }

    // This position is valid, create the star with DecorativeStar instead of YellowStar
    decorativeStars.push(new DecorativeStar(starX, starY));
  }

  // Create hidden input element for selectable link text
  linkInput = createElement('input');
  linkInput.position(100, -50); // Initially hidden off-screen
  linkInput.attribute('readonly', true);
  linkInput.style('font-size', '16px');
  linkInput.style('width', '300px');
  linkInput.style('background-color', 'rgba(40, 60, 100, 0.8)');
  linkInput.style('color', 'rgb(100, 255, 100)');
  linkInput.style('border', '1px solid rgb(80, 120, 255)');
  linkInput.style('border-radius', '5px');
  linkInput.style('padding', '5px');

  // Initialize spacecraft array (empty - will be populated when button is clicked)
  allSpacecraft = [];
}

function draw() {
  // Dark space background
  background(10, 15, 30);

  // Draw twinkling stars
  drawStars();

  // Draw target star and decorative stars
  targetStar.draw();

  // Draw all decorative stars
  for (let star of decorativeStars) {
    star.draw();
  }

  // Draw all spacecraft if flying
  if (isFlying) {
    drawAllSpacecraft();
  }

  // Draw rules section on the left
  drawRulesSection();

  // Draw images around the rules on the left
  drawGameImages();

  // Display enlarged image on the right
  drawEnlargedImage();

  // Draw create game button
  drawGameButton();

//  fill(225)
//  text(mouseX + ", " + mouseY, 50, 50); Jens
}

function drawStars() {
  fill(255);
  noStroke();
  for (let star of stars) {
    // Make stars twinkle
    let brightness = 150 + 105 * sin(frameCount * star.twinkle);
    fill(brightness);
    ellipse(star.x, star.y, star.size);
  }
}

function drawRulesSection() {
  // Background for rules text - positioned to align with the new circle center
  let radius = 400;
  let centerX = 100 + radius;
  let centerY = 100 + radius;

  // Game title - moved up by 50 pixels
  drawingContext.shadowBlur = 25;
  drawingContext.shadowColor = 'rgba(100, 200, 255, 0.9)';
  fill(100, 150, 255);
  textSize(40);
  textFont('Helvetica'); // Use a more modern font
  text("SPACE STRATEGO", centerX, centerY - 240);
  drawingContext.shadowBlur = 0;

  // Game rules - also moved up by 50 pixels
  fill(200, 220, 255);
  textSize(15);

  // Define narrower text with shorter line breaks
  let rules = "Space Stratego is the ultimate friday fun game where\n" +
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
  text(rules, centerX, centerY - 40); // Moved up from centerY + 10
}

function drawGameImages() {
  // Fixed position with 100px spacing from edges
  let radius = 400;               // Reduced from 500 to 400
  let centerX = 100 + radius;     // 100px from left edge + radius
  let centerY = 100 + radius;     // 100px from top edge + radius
  let imgSize = 120;              // Keep the same image size

  hoveredImageIndex = -1; // Reset hover state

  // Reset all decorative stars' hover states
  for (let star of decorativeStars) {
    star.setButtonHovered(false);
  }

  for (let i = 0; i < gameImages.length; i++) {
    let angle = i * (TWO_PI / Math.max(4, gameImages.length));
    let x = centerX + radius * cos(angle) - imgSize / 2;
    let y = centerY + radius * sin(angle) - imgSize / 2;

    // Check if mouse is hovering over this image
    if (mouseX > x && mouseX < x + imgSize &&
      mouseY > y && mouseY < y + imgSize) {
      hoveredImageIndex = i;

      // Activate corresponding star if available
      // Use modulo to wrap around if we have more images than stars
      if (i < decorativeStars.length) {
        decorativeStars[i].setButtonHovered(true);
      }

      // Add stronger glow effect for hovered image
      drawingContext.shadowBlur = 30;
      drawingContext.shadowColor = 'rgba(100, 200, 255, 0.8)';
    } else {
      // Regular glow effect
      drawingContext.shadowBlur = 20;
      drawingContext.shadowColor = 'rgba(50, 100, 255, 0.5)';
    }

    image(gameImages[i], x, y, imgSize, imgSize);

    // Reset shadow
    drawingContext.shadowBlur = 0;
  }
}

function drawEnlargedImage() {
  // Display enlarged version of hovered image on right side
  if (hoveredImageIndex >= 0 && hoveredImageIndex < gameImages.length) {
    // Calculate position for enlarged image with spacing from circle edge
    let radius = 400;
    let circleRightEdge = 100 + radius * 2 + 150; // Right edge of circle + 150px gap (increased by 50px)

    let enlargedSize = 800;
    let x = circleRightEdge;
    let y = height / 2 - enlargedSize / 2 - 100; // Move up 100px from current position

    // Add dramatic glow effect behind enlarged image
    drawingContext.shadowBlur = 40;
    drawingContext.shadowColor = 'rgba(100, 200, 255, 0.7)';

    // Draw semi-transparent background
    fill(20, 40, 80, 200);
    rectMode(CORNER);
    rect(x - 20, y - 20, enlargedSize + 40, enlargedSize + 40, 15);

    // Draw the enlarged image
    image(gameImages[hoveredImageIndex], x, y, enlargedSize, enlargedSize);

    // Add image name caption
    fill(255);
    textSize(24);
    let imageName = extractImageName(hoveredImageIndex);
    text(imageName, x + enlargedSize / 2, y + enlargedSize + 30);

    // Reset shadow
    drawingContext.shadowBlur = 0;
  }
}

function extractImageName(index) {
  // Extract image name from the path
  let path = gameImages[index].src || "";
  let filename = path.split('/').pop();
  let name = filename.split('.')[0];

  // Format the name (replace camelCase with spaces, capitalize words)
  name = name.replace(/([A-Z])/g, ' $1')
    .replace(/([0-9])/g, ' $1')
    .trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function drawGameButton() {
  // Position the button with the newly positioned rules section
  let radius = 400;    
  let buttonX = 100 + radius;    
  let buttonY = 100 + radius + 170; 
  let buttonW = 220;
  let buttonH = 50;

  // Button hover effect - Only apply when not flying
  let isButtonHovered = mouseX > buttonX - buttonW / 2 && mouseX < buttonX + buttonW / 2 &&
    mouseY > buttonY - buttonH / 2 && mouseY < buttonY + buttonH / 2 && !isFlying;

  // Update star's hover state
  targetStar.setButtonHovered(isButtonHovered);
  //targetStar.setButtonHovered(true); Jens
  
  // Use disabled appearance when spacecraft are flying
  if (isFlying) {
    // Disabled button appearance
    fill(60, 70, 100); // Gray-blue for disabled state
    drawingContext.shadowBlur = 5;
    drawingContext.shadowColor = 'rgba(50, 50, 100, 0.3)';
  } else if (isButtonHovered) {
    // Enabled and hovered state
    fill(80, 120, 255);
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(100, 150, 255, 0.8)';
  } else {
    // Enabled but not hovered state
    fill(40, 70, 180);
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'rgba(50, 100, 255, 0.5)';
  }

  rectMode(CENTER);
  rect(buttonX, buttonY, buttonW, buttonH, 10);
  drawingContext.shadowBlur = 0;

  // Button text - slightly dimmed when disabled
  fill(isFlying ? 150 : 255); 
  textSize(18);
  text("START NEW GAME", buttonX, buttonY);

  // Display copied link if available - now positioned under the button
  if (copied) {
    fill(100, 255, 100);
    textSize(16);
    text("Game room created!", buttonX, buttonY + 40);
    text("Link copied to clipboard:", buttonX, buttonY + 65);

    // Show selectable link text
    let inputX = buttonX - 150; // Center input horizontally
    let inputY = buttonY + 90;  // Position below the text
    linkInput.position(inputX, inputY);
    linkInput.value(roomLink);
  } else {
    // Hide the input when not needed
    linkInput.position(100, -50); // Off-screen
  }
}

// Restore the mousePressed function to its original state (without the image click detection)
function mousePressed() {
  // Check if mouse is over the button - update coordinates to match new button position
  let radius = 400;   
  let buttonX = 100 + radius;
  let buttonY = 100 + radius + 170;
  let buttonW = 220;
  let buttonH = 50;

  // Only process button clicks when spacecraft are not flying
  if (!isFlying && 
      mouseX > buttonX - buttonW / 2 && mouseX < buttonX + buttonW / 2 &&
      mouseY > buttonY - buttonH / 2 && mouseY < buttonY + buttonH / 2) {

    let randomNumber = Math.floor(Math.random() * 1000000) + 1;
    roomLink = "https://spacemanjens.github.io/spaceSV10/?room=" + randomNumber;

    // Copy to clipboard
    navigator.clipboard.writeText(roomLink).then(() => {
      copied = true;

      // Clear previous spacecraft
      allSpacecraft = [];

      // Calculate positions for all spacecraft
      let imageRadius = 400;
      let centerX = 100 + imageRadius;
      let centerY = 100 + imageRadius;
      let imgSize = 120;

      // Create a spacecraft for each small image
      for (let i = 0; i < gameImages.length; i++) {
        let adjustment = 0
        if (i > 0){
           xAdjustment = 30;
           yAdjustment = 30;
        } else  { 
          xAdjustment = 80;
          yAdjustment = 20;
       }
        let angle = i * (TWO_PI / Math.max(4, gameImages.length));
        let imageX = centerX + imageRadius * cos(angle) - imgSize / 2 - xAdjustment ;
        let imageY = centerY + imageRadius * sin(angle) - imgSize / 2 - yAdjustment  ;

        // Position spacecraft below the image
        let craftX = imageX + imgSize / 2;
        let craftY = imageY + imgSize + 10; // Position just below the image
        let craftSize = 70 + random(-10, 10); // Slightly varied sizes

        // Create and store spacecraft with a random image from the 20 available
        let imageIndex = i % spacecraftImages.length; // Use different image for each (wraps around if needed)
        allSpacecraft.push(new Spacecraft(craftX, craftY, craftSize, imageIndex));
      }

      // Reset animation timing - revert to original duration
      targetStar.startFrame = frameCount;
      targetStar.animationFrames = 180; // Original animation length (3 seconds at 60fps)

      isFlying = true;

    })
  }

  // Check if a small image was clicked
  let imageRadius = 400;
  let centerX = 100 + imageRadius;
  let centerY = 100 + imageRadius;
  let imgSize = 120;

  for (let i = 0; i < gameImages.length; i++) {
    let angle = i * (TWO_PI / Math.max(4, gameImages.length));
    let x = centerX + imageRadius * cos(angle) - imgSize / 2;
    let y = centerY + imageRadius * sin(angle) - imgSize / 2;

    // Check if mouse is over this image
    if (mouseX > x && mouseX < x + imgSize &&
      mouseY > y && mouseY < y + imgSize) {

      // Find the corresponding star and trigger supernova
      if (i < decorativeStars.length) {
        decorativeStars[i].triggerSupernova();
      }

      // Don't need to check other images
      break;
    }
  }
}

function drawAllSpacecraft() {
  // Calculate progress based on frame count
  let progress = (frameCount - targetStar.startFrame) / targetStar.animationFrames;
  progress = constrain(progress, 0, 1);

  // Only continue if not all spacecraft have reached the target
  if (progress < 1) {
    for (let i = 0; i < allSpacecraft.length; i++) {
      let craft = allSpacecraft[i];

      // Calculate distance-based delay factor for each spacecraft
      let delay = 0.2 * (i / allSpacecraft.length); // Staggered start
      let craftProgress = constrain((progress - delay) * (1 / (1 - delay)), 0, 1);

      // Lerp position toward target
      let currentX = lerp(craft.x, targetStar.x, craftProgress);
      let currentY = lerp(craft.y, targetStar.y, craftProgress);

      // Size reduces as it approaches target
      let currentSize = lerp(craft.size, 20, craftProgress);

      // Only draw if the craft has started moving
      if (craftProgress > 0) {
        noStroke();

        // Get the correct spacecraft image from the array
        let craftImage = spacecraftImages[craft.imageIndex];

        if (craftImage) {
          // Make glow color varied based on image index for visual interest
          let hue = (craft.imageIndex * 15) % 360; // Distribute colors around the color wheel
          drawingContext.shadowBlur = 10;
          drawingContext.shadowColor = `hsla(${hue}, 100%, 60%, 0.7)`;

          image(craftImage, currentX - currentSize / 2, currentY - currentSize / 2,
            currentSize, currentSize);

          drawingContext.shadowBlur = 0;
        }
      }
    }
  } else if (progress >= 1 && isFlying) {
    // Stop animation
    isFlying = false;
  }
}