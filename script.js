// script.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let gridSize;
let snake = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5 };
let score = 0;
let gameSpeed = 100; // Initial game speed
let isGameOver = false;

let dx = 1; // Horizontal velocity
let dy = 0; // Vertical velocity

// Function to draw the snake
function drawSnake() {
    if (isGameOver) return;
    snake.forEach(segment => {
        ctx.fillStyle = 'green';
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });
}

// Function to draw the food
function drawFood() {
    if (isGameOver) return;
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

// Function to check collision with wall
function checkWallCollision() {
    const head = snake[0];
    if (head.x < 0 ||
        head.x >= canvas.width / gridSize ||
        head.y < 0 ||
        head.y >= canvas.height / gridSize) {
        return true;
    }
    return false;
}

function checkSelfCollision() {
    const head = snake[0];
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    return false;
}

function gameOver() {
    isGameOver = true;
    alert(`Game Over! Your score: ${score}`);
    resetGame();
}

// Function to reset the game
function resetGame() {
    snake = [{ x: 10, y: 10 }];
    food = generateFood();
    dx = 1;
    dy = 0;
    score = 0;
    gameSpeed = 100;
    isGameOver = false;
    updateScore();
}

// Function to generate food at a random location
function generateFood() {
    let newFood = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize))
    };
    return newFood;
}

// Function to update the score
function updateScore() {
    document.getElementById('score').innerText = `Score: ${score}`;
}

function update() {
  if (isGameOver) return;
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  if (checkWallCollision() || checkSelfCollision()) {
      gameOver();
      return;
  }

  snake.unshift(head); // Add the new head to the snake
  snake.pop(); // Remove the tail
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') {
        dx = 0;
        dy = -1;
    }
    });
document.getElementById('downBtn').addEventListener('click', () => {
  dx = 0;
  dy = 1;
    });
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
        dx = 0;
        dy = 1;
    }
    });

document.getElementById('leftBtn').addEventListener('click', () => {
    dx = -1;
    dy = 0;
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        dx = -1;
        dy = 0;
    }
    });
document.getElementById('rightBtn').addEventListener('click', () => {
    dx = 1;
    dy = 0;
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
        dx = 1;
        dy = 0;
    }
});

// Function to handle window resize
function handleResize() {
    canvas.width = window.innerWidth * 0.8;  // Adjust as needed
    canvas.height = window.innerHeight * 0.8; // Adjust as needed
    gridSize = Math.min(20, Math.floor(canvas.width / 20), Math.floor(canvas.height / 20)); // Maximum gridSize of 20
}

// Call handleResize initially and on window resize
window.addEventListener('resize', handleResize);
handleResize(); // Initial setup

// Initialize the game
function init() {
    handleResize();
    food = generateFood();
    updateScore();
}

// Main game loop
function gameLoop() {
  update();
  draw();
  setTimeout(gameLoop, gameSpeed); // Adjust speed as needed
}

init();

gameLoop();
