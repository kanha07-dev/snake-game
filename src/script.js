// Game grid dimensions - defined globally as they are constant for the game
let gridSize = 20; // Size of each tile in pixels
let tileCount = 30; // Number of tiles across (and down)

// Game scores - declared and initialized early to be accessible
let bestScore = localStorage.getItem("bestScore") || 0;
let lastScore = localStorage.getItem("lastScore") || 0;

// Ensure DOM is loaded before accessing elements
let canvas, ctx;
let scoreText, bestScoreText, lastScoreText, startOverlay, gameOverOverlay, finalScore;

document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  // Set internal drawing resolution for the canvas AFTER it's been retrieved
  canvas.width = gridSize * tileCount;
  canvas.height = gridSize * tileCount;

  scoreText = document.getElementById("scoreText");
  bestScoreText = document.getElementById("bestScoreText");
  lastScoreText = document.getElementById("lastScoreText");
  startOverlay = document.getElementById("startOverlay");
  gameOverOverlay = document.getElementById("gameOverOverlay");
  finalScore = document.getElementById("finalScore");

  // Now that bestScore and lastScore are initialized, update the display
  bestScoreText.innerText = "Best: " + bestScore;
  lastScoreText.innerText = "Last: " + lastScore;

  resetGame();
  draw(0);
});

// Snake state
// `snake` holds the current integer grid positions of segments.
let snake = [];
// `prevSnake` holds the integer grid positions from the previous game logic update.
// Used for interpolation during drawing to achieve smooth movement.
let prevSnake = [];
let initialSnakeLength = 4; // Starting length of the snake
let dx = 0; // x velocity (change in x per logic tick: -1, 0, or 1)
let dy = 0; // y velocity (change in y per logic tick: -1, 0, or 1)

// 🎨 Fruits list for diverse food icons
const fruits = ["🍎","🍌","🍇","🍒","🍓","🍍","🥭","🍉","🍑","🍐"];
let food = {x: 0, y: 0, icon: "🍎"}; // Food position and icon

let score = 0; // Current game score
let gameRunning = false; // Flag to control game state

// Speed system: milliseconds per game tick (lower = faster)
let speed = 120; // Default to medium speed
// `lastLogicUpdateTime` stores the timestamp of the last time `updateLogic` was called.
let lastLogicUpdateTime = 0;
// `animationFrameId` stores the ID returned by `requestAnimationFrame`, used to cancel it.
let animationFrameId = null;



/**
 * The main animation loop, driven by requestAnimationFrame.
 * This function runs as often as the browser can, providing smooth visuals.
 * It also triggers game logic updates at a fixed interval (`speed`).
 * @param {DOMHighResTimeStamp} currentTime - The current time provided by requestAnimationFrame.
 */
function animationLoop(currentTime) {
  if (!gameRunning) {
    // If game is not running, stop the animation loop and reset time.
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    lastLogicUpdateTime = currentTime; // Reset last update time for next start
    return;
  }

  // Calculate time elapsed since the last frame
  const deltaTime = currentTime - lastLogicUpdateTime;

  // Run game logic (`updateLogic`) only when enough time (`speed`) has passed.
  // This ensures fixed-step physics/logic regardless of frame rate.
  if (deltaTime >= speed) {
    lastLogicUpdateTime = currentTime - (deltaTime % speed); // Adjust to prevent time drift
    // Deep copy `snake` to `prevSnake` before updating `snake`.
    // This `prevSnake` represents the snake's state *before* the current logic update,
    // which is crucial for interpolating positions during drawing.
    prevSnake = snake.map(segment => ({...segment}));
    updateLogic(); // Perform game logic update
  }

  // Calculate interpolation factor (0 to 1).
  // This determines how far between the `prevSnake` position and `current snake` position
  // we should draw for smooth movement.
  const interpolationFactor = Math.min(1, deltaTime / speed);

  // Draw the game state, using interpolation for smooth movement.
  draw(interpolationFactor);

  // Request the next animation frame to continue the loop.
  animationFrameId = requestAnimationFrame(animationLoop);
}

/**
 * Updates the game state (snake position, collisions, scoring).
 * This function runs at a fixed `speed` interval, decoupled from drawing.
 */
function updateLogic() {
  // Calculate the new head position based on current velocity
  let headX = snake[0].x + dx;
  let headY = snake[0].y + dy;

  // Check for wall collision
  if (headX < 0 || headX >= tileCount || headY < 0 || headY >= tileCount) {
    gameOver();
    return; // Exit update if game over
  }

  // Check for self-collision
  // Iterate from the second segment (index 1) to avoid checking against itself
  for (let i = 1; i < snake.length; i++) {
    if (headX === snake[i].x && headY === snake[i].y) {
      gameOver();
      return; // Exit update if game over
    }
  }

  // Add the new head to the beginning of the snake array
  snake.unshift({x: headX, y: headY});

  // Check for food collision
  if (headX === food.x && headY === food.y) {
    score++; // Increase score
    placeFood(); // Place new food
    // Snake grows: do not remove the tail (it stays the same length)
  } else {
    snake.pop(); // Snake moves: remove the last segment (tail)
  }

  // Update score display
  scoreText.innerText = "Score: " + score;
}

/**
 * Clears the canvas and redraws all game elements:
 * snake, food, and applies visual effects, using interpolation for smoothness.
 * @param {number} interpolationFactor - A value (0-1) indicating how much to interpolate
 * between the previous and current logic states.
 */
function draw(interpolationFactor) {
  // Clear the entire canvas for redrawing
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the food item first so the snake draws over it
  drawFood();

  // Draw the snake body segments as a continuous, alternating red and black path
  if (snake.length > 1) { // Ensure there are enough segments to draw a line
    // Iterate from the segment just behind the head (index 1) to the tail
    for (let i = 1; i < snake.length; i++) {
      let currentSeg = snake[i];
      let prevSeg = prevSnake[i] || snake[i]; // Fallback for newly added segments

      // Interpolate position for smooth animation
      let interpolatedX = prevSeg.x + (currentSeg.x - prevSeg.x) * interpolationFactor;
      let interpolatedY = prevSeg.y + (currentSeg.y - prevSeg.y) * interpolationFactor;

      // Determine the next segment's interpolated position for drawing the line
      let nextSeg = snake[i - 1]; // The segment "ahead" of currentSeg
      let prevNextSeg = prevSnake[i - 1] || snake[i - 1];
      let interpolatedNextX = prevNextSeg.x + (nextSeg.x - prevNextSeg.x) * interpolationFactor;
      let interpolatedNextY = prevNextSeg.y + (nextSeg.y - prevNextSeg.y) * interpolationFactor;

      ctx.beginPath();
      ctx.lineCap = 'round'; // Round caps for line ends
      ctx.lineJoin = 'round'; // Round joins for corners
      ctx.lineWidth = gridSize; // Make the line width equal to grid size for a solid fill

      // Set alternating colors
      ctx.strokeStyle = (i % 2 === 0) ? "#D32F2F" : "#000"; // Alternating Red or Black

      // Move to the center of the current segment (which is the start of this line segment)
      ctx.moveTo(interpolatedX * gridSize + gridSize / 2, interpolatedY * gridSize + gridSize / 2);
      // Draw a line to the center of the segment ahead (which is the end of this line segment)
      ctx.lineTo(interpolatedNextX * gridSize + gridSize / 2, interpolatedNextY * gridSize + gridSize / 2);
      ctx.stroke(); // Render the line segment
    }
  }

  // Determine the interpolated head position for drawing
  let renderHeadX, renderHeadY;
  // If prevSnake has data (meaning the game has run at least one logic step), interpolate.
  if (prevSnake[0] && prevSnake.length > 0) {
    renderHeadX = prevSnake[0].x + (snake[0].x - prevSnake[0].x) * interpolationFactor;
    renderHeadY = prevSnake[0].y + (snake[0].y - prevSnake[0].y) * interpolationFactor;
  } else {
    // If it's the very first draw or prevSnake is empty, just draw at current position.
    renderHeadX = snake[0].x;
    renderHeadY = snake[0].y;
  }
  // Draw the snake head last to ensure it's always on top
  drawSnakeHead(renderHeadX, renderHeadY);
}

/**
 * Draws the snake's head with a distinctive gradient, eyes, and tongue.
 * @param {number} x - Interpolated X coordinate of the head on the grid.
 * @param {number} y - Interpolated Y coordinate of the head on the grid.
 */
function drawSnakeHead(x, y) {
  let px = x * gridSize + gridSize / 2; // Center X of the head in pixels
  let py = y * gridSize + gridSize / 2; // Center Y of the head in pixels

  // Radial gradient for the head for a glowing effect
  let gradient = ctx.createRadialGradient(px, py, 2, px, py, gridSize / 1.3);
  gradient.addColorStop(0, "#ff5252"); // Brighter red center
  gradient.addColorStop(1, "#000"); // Black outer edge

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(px, py, gridSize / 1.5, 0, Math.PI * 2); // Slightly smaller head circle
  ctx.fill();

  // Eyes (white part)
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(px - gridSize / 5, py - gridSize / 4, gridSize / 8, 0, Math.PI * 2); // Left eye, slightly higher
  ctx.arc(px + gridSize / 5, py - gridSize / 4, gridSize / 8, 0, Math.PI * 2); // Right eye, slightly higher
  ctx.fill();

  // Pupils (black part)
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(px - gridSize / 5, py - gridSize / 4, gridSize / 16, 0, Math.PI * 2);
  ctx.arc(px + gridSize / 5, py - gridSize / 4, gridSize / 16, 0, Math.PI * 2);
  ctx.fill();

  // Tongue animation
  // The tongue appears and disappears, creating a flicking effect
  if (Math.floor(Date.now() / 200) % 2 === 0) { // Faster tongue flicker
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2.5; // Slightly thicker tongue
    ctx.beginPath();
    ctx.moveTo(px, py + gridSize / 3); // Start of tongue (from lower head)
    ctx.lineTo(px, py + gridSize / 1.5); // End of tongue
    ctx.stroke();
  }
}

/**
 * Draws the current food item on the canvas using an emoji.
 */
function drawFood() {
  ctx.font = `${gridSize * 1.2}px Arial`; // Make emoji size dynamic with grid
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(food.icon, food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2);
}

/**
 * Places a new food item at a random empty location on the grid.
 * Ensures food does not spawn on the snake.
 */
function placeFood() {
  let newFoodX, newFoodY;
  let collisionWithSnake;
  do {
    collisionWithSnake = false;
    // Generate random coordinates within the playable area (excluding borders)
    newFoodX = Math.floor(Math.random() * tileCount);
    newFoodY = Math.floor(Math.random() * tileCount);

    // Check if the generated position collides with any part of the snake
    for (let i = 0; i < snake.length; i++) {
      if (newFoodX === snake[i].x && newFoodY === snake[i].y) {
        collisionWithSnake = true;
        break; // If collision, try again
      }
    }
  } while (collisionWithSnake); // Keep looping until a non-colliding spot is found

  food = {x: newFoodX, y: newFoodY, icon: fruits[Math.floor(Math.random() * fruits.length)]};
}

/**
 * Handles the end of the game: stops the loop, updates scores,
 * and displays the game over overlay.
 */
function gameOver() {
  gameRunning = false;
  // Cancel the animation frame loop
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  // Update last score in local storage and display
  localStorage.setItem("lastScore", score);
  lastScore = score; // Update last score variable
  lastScoreText.innerText = "Last: " + lastScore;

  // Update best score if current score is higher
  if (score > bestScore) {
    localStorage.setItem("bestScore", score);
    bestScore = score; // Update best score variable
    bestScoreText.innerText = "Best: " + bestScore;
  }

  // Display final score on the game over screen
  finalScore.innerText = "Your Score: " + score;
  gameOverOverlay.style.display = "flex"; // Show game over screen
}

/**
 * Resets all game variables to their initial state
 * for a new game.
 */
function resetGame() {
  // Initialize snake with default position and length
  snake = [];
  for (let i = 0; i < initialSnakeLength; i++) {
    snake.push({x: Math.floor(tileCount / 2) - i, y: Math.floor(tileCount / 2)});
  }
  dx = 1; // Initial direction: moving right
  dy = 0;

  score = 0; // Reset score
  placeFood(); // Place initial food
  
  // Initialize prevSnake to be the same as snake for the very first frame
  // This ensures interpolation has a starting point immediately.
  prevSnake = snake.map(segment => ({...segment}));
}

/**
 * Starts the game with a chosen difficulty level.
 * @param {string} level - The difficulty level ('easy', 'medium', 'hard').
 */
window.startGame = function(level) {
  if (level === 'easy') speed = 180;
  else if (level === 'medium') speed = 120;
  else if (level === 'hard') speed = 80;
  else speed = 120;
  resetGame();
  gameRunning = true;
  startOverlay.style.display = "none";
  gameOverOverlay.style.display = "none";
  lastLogicUpdateTime = performance.now();
  animationFrameId = requestAnimationFrame(animationLoop);
}

/**
 * Restarts the game after a game over.
 */
window.restartGame = function() {
  resetGame();
  gameRunning = true;
  gameOverOverlay.style.display = "none";
  lastLogicUpdateTime = performance.now();
  animationFrameId = requestAnimationFrame(animationLoop);
}

// Keyboard input for snake direction
document.addEventListener('keydown', e => {
  // Prevent snake from reversing directly into itself
  if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; }
  else if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; }
  else if (e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; }
  else if (e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; }
});
