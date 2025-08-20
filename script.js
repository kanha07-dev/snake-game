const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const currentScoreEl = document.getElementById('current-score');
const bestScoreEl = document.getElementById('best-score');
const gameOverContainer = document.getElementById('game-over-container');
const finalScoreEl = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

const gridSize = 20;
let canvasSize;

function setCanvasSize() {
    const size = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.6);
    canvas.width = Math.floor(size / gridSize) * gridSize;
    canvas.height = canvas.width;
    canvasSize = canvas.width;
}

let snake = [{ x: 10, y: 10 }];
let fruit = {};
let direction = { x: 0, y: 0 };
let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let level = 1;
let speed = 200; // ms per move
let lastMoveTime = 0;
let gameOver = false;

const fruits = ['🍎', '🍊', '🍇', '🍉', '🍓', '🍒', '🍑', '🍍'];
const snakeHeadEmoji = '🐍';
const snakeBodyEmoji = '🟢';

function getSpeedForLevel(level) {
    if (level === 1) return 200;
    if (level === 2) return 150;
    if (level === 3) return 100;
    return 100;
}

function updateLevel() {
    if (score >= 20 && level < 3) {
        level = 3;
    } else if (score >= 10 && level < 2) {
        level = 2;
    }
    speed = getSpeedForLevel(level);
}

function generateFruit() {
    fruit = {
        x: Math.floor(Math.random() * (canvasSize / gridSize)),
        y: Math.floor(Math.random() * (canvasSize / gridSize)),
        emoji: fruits[Math.floor(Math.random() * fruits.length)]
    };
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw fruit
    ctx.font = `${gridSize}px Arial`;
    ctx.fillText(fruit.emoji, fruit.x * gridSize, (fruit.y + 1) * gridSize);

    // Draw snake
    snake.forEach((segment, index) => {
        const emoji = index === 0 ? snakeHeadEmoji : snakeBodyEmoji;
        ctx.fillText(emoji, segment.x * gridSize, (segment.y + 1) * gridSize);
    });
}

function update() {
    if (gameOver) return;

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Wall collision
    if (head.x < 0 || head.x >= canvasSize / gridSize || head.y < 0 || head.y >= canvasSize / gridSize) {
        endGame();
        return;
    }

    // Self collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            endGame();
            return;
        }
    }

    snake.unshift(head);

    // Fruit collision
    if (head.x === fruit.x && head.y === fruit.y) {
        score++;
        updateLevel();
        generateFruit();
    } else {
        snake.pop();
    }

    currentScoreEl.textContent = score;
}

function gameLoop(currentTime) {
    if (gameOver) return;

    if (currentTime - lastMoveTime > speed) {
        lastMoveTime = currentTime;
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

function startGame() {
    setCanvasSize();
    snake = [{ x: 10, y: 10 }];
    direction = { x: 0, y: 0 };
    score = 0;
    level = 1;
    speed = getSpeedForLevel(level);
    gameOver = false;
    gameOverContainer.classList.add('hidden');
    currentScoreEl.textContent = score;
    bestScoreEl.textContent = bestScore;
    generateFruit();
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameOver = true;
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('bestScore', bestScore);
    }
    finalScoreEl.textContent = score;
    gameOverContainer.classList.remove('hidden');
}

// Event Listeners
document.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
            if (direction.y === 0) direction = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
            if (direction.y === 0) direction = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
            if (direction.x === 0) direction = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
            if (direction.x === 0) direction = { x: 1, y: 0 };
            break;
    }
});

// Touch controls
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!touchStartX || !touchStartY) {
        return;
    }

    let touchEndX = e.touches[0].clientX;
    let touchEndY = e.touches[0].clientY;

    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) { // Horizontal swipe
        if (diffX > 0 && direction.x === 0) {
            direction = { x: 1, y: 0 };
        } else if (diffX < 0 && direction.x === 0) {
            direction = { x: -1, y: 0 };
        }
    } else { // Vertical swipe
        if (diffY > 0 && direction.y === 0) {
            direction = { x: 0, y: 1 };
        } else if (diffY < 0 && direction.y === 0) {
            direction = { x: 0, y: -1 };
        }
    }

    touchStartX = 0;
    touchStartY = 0;
});


restartButton.addEventListener('click', startGame);
window.addEventListener('resize', startGame);

startGame();
