const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load images
const playerImg = new Image();
playerImg.src = 'player.png';
const bananaImg = new Image();
bananaImg.src = 'banana.png';
const waterImg = new Image();
waterImg.src = 'water.png';
const badImg = new Image();
badImg.src = 'bad.png';

// Sound effects
const bananaSound = new Audio('banana.mp3');
bananaSound.volume = 0.25;
const waterSound = new Audio('water.mp3');
waterSound.volume = 0.25;
const backgroundMusic = document.getElementById('backgroundMusic');
backgroundMusic.volume = 0.3;

// Game objects
const player = {
    x: canvas.width / 2 - 84.5,
    y: canvas.height - 229,
    width: 169,
    height: 219,
    speed: 10
};

let items = [];
let particles = [];
let bananaCount = 0;
let waterCount = 0;
let score = 0;
const bananaGoal = 20;
const waterGoal = 15;

// Time management
let startTime = new Date(2025, 2, 24, 3, 53, 0); // March 24, 2025, 3:53 AM
let endTime = new Date(2025, 2, 24, 8, 0, 0);   // 8:00 AM
let currentTime = new Date(startTime);
let gameOver = false;
let musicStarted = false;
let gameStarted = false;

// Hourly time display
let lastDisplayedHour = 3; // Start at 3 AM
let showHourTime = 0; // Seconds to show the hour

// Falling speed and spawn rates
let baseSpeed = 2;
let speedIncrease = 0.25;
let spawnRate = 1000;
let badItemChance = 0.2;

// Interval IDs to manage intervals
let spawnInterval = null;
let timeInterval = null;

// Controls
let leftPressed = false;
let rightPressed = false;

document.addEventListener('keydown', (e) => {
    if (!gameStarted) {
        gameStarted = true;
        document.getElementById('instructions').style.display = 'none';
        startMusic();
        startGame();
    } else {
        if (e.key === 'ArrowLeft') {
            leftPressed = true;
        }
        if (e.key === 'ArrowRight') {
            rightPressed = true;
        }
        if (e.key === 'r' && gameOver) resetGame();
    }
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') leftPressed = false;
    if (e.key === 'ArrowRight') rightPressed = false;
});

function startMusic() {
    if (!musicStarted) {
        backgroundMusic.play().then(() => {
            musicStarted = true;
        }).catch(err => {
            console.log("Audio play failed: ", err);
        });
    }
}

function spawnItem() {
    const typeRoll = Math.random();
    let type;
    if (typeRoll < 0.5) {
        type = 'bad';
    } else if (typeRoll < 0.825) {
        type = 'banana';
    } else {
        type = 'water';
    }
    const img = type === 'banana' ? bananaImg : 
                type === 'water' ? waterImg : badImg;
    const width = type === 'bad' ? 42 : (type === 'water' ? 156 : 78);
    const height = type === 'bad' ? 72.8 : (type === 'water' ? 156 : 78);
    items.push({
        x: Math.random() * (canvas.width - width),
        y: -height,
        width: width,
        height: height,
        type: type,
        img: img,
        speed: baseSpeed
    });
}

function spawnParticles(x, y, color) {
    for (let i = 0; i < 30; i++) { // Increased from 10 to 30 for more particles
        particles.push({
            x: x + Math.random() * 20 - 10,
            y: y + Math.random() * 20 - 10,
            vx: Math.random() * 6 - 3, // Bigger burst (was * 4 - 2)
            vy: Math.random() * 6 - 3, // Bigger burst (was * 4 - 2)
            size: Math.random() * 5 + 2, // Original size (2-7)
            life: 20,
            color: color
        });
    }
}

function updateTime() {
    if (gameOver || !gameStarted) return;
    currentTime.setMinutes(currentTime.getMinutes() + 2);
    const timeStr = currentTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    });
    document.getElementById('time').textContent = timeStr;

    const halfHoursPassed = Math.floor((currentTime - startTime) / (1000 * 60 * 30));
    baseSpeed = 2 + halfHoursPassed * speedIncrease;

    // Check for new hour
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    if (currentMinute === 0 && currentHour > lastDisplayedHour) {
        lastDisplayedHour = currentHour;
        showHourTime = 2; // Show for 2 seconds
        const hourDisplay = document.getElementById('hourDisplay');
        hourDisplay.textContent = `${currentHour}:00 AM`;
        hourDisplay.style.display = 'block';
        setTimeout(() => {
            hourDisplay.style.display = 'none';
        }, 2000); // Hide after 2 seconds
    }

    if (currentTime >= endTime) {
        checkWinCondition();
    }
}

function checkWinCondition() {
    if (bananaCount >= bananaGoal && waterCount >= waterGoal) {
        score += 5000;
        document.getElementById('gameMessage').textContent = `You Win!\nFinal Score: ${score}`;
        document.getElementById('gameMessage').style.color = '#00ff00';
    } else if (!gameOver) {
        document.getElementById('gameMessage').textContent = `Game Over!\nNeeded ${bananaGoal} bananas, ${waterGoal} water\nFinal Score: ${score}`;
        document.getElementById('gameMessage').style.color = '#ff4444';
    }
    gameOver = true;
    document.getElementById('gameMessage').style.display = 'block';
    document.getElementById('restart').style.display = 'block';
    updateScoreboard();
}

function resetGame() {
    if (spawnInterval) clearInterval(spawnInterval);
    if (timeInterval) clearInterval(timeInterval);

    gameOver = false;
    bananaCount = 0;
    waterCount = 0;
    score = 0;
    items = [];
    particles = [];
    currentTime = new Date(startTime);
    baseSpeed = 2;
    badItemChance = 0.2;
    lastDisplayedHour = 3;
    showHourTime = 0;
    player.x = canvas.width / 2 - 84.5;
    document.getElementById('restart').style.display = 'none';
    document.getElementById('gameMessage').style.display = 'none';
    document.getElementById('hourDisplay').style.display = 'none'; // Reset hour display
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
    musicStarted = true;
    updateScoreboard();

    spawnInterval = setInterval(spawnItem, spawnRate);
    timeInterval = setInterval(updateTime, 1000);
    gameLoop();
}

function startGame() {
    baseSpeed = 2;
    spawnInterval = setInterval(spawnItem, spawnRate);
    timeInterval = setInterval(updateTime, 1000);
    gameLoop();
}

function update() {
    if (gameOver || !gameStarted) return;

    if (leftPressed && player.x > 0) player.x -= player.speed;
    if (rightPressed && player.x < canvas.width - player.width) player.x += player.speed;

    items.forEach((item, index) => {
        item.y += item.speed;
        if (item.y > canvas.height) {
            items.splice(index, 1);
        } else if (collides(player, item)) {
            if (item.type === 'banana') {
                bananaCount++;
                score += 1000;
                bananaSound.play();
                spawnParticles(item.x + item.width / 2, item.y + item.height / 2, '#ffd700');
            } else if (item.type === 'water') {
                waterCount++;
                score += 2000;
                waterSound.play();
                spawnParticles(item.x + item.width / 2, item.y + item.height / 2, '#00b7ff');
            } else if (item.type === 'bad') {
                gameOver = true;
                document.getElementById('gameMessage').textContent = `Game Over!\nFinal Score: ${score}`;
                document.getElementById('gameMessage').style.color = '#ff4444';
                document.getElementById('gameMessage').style.display = 'block';
                document.getElementById('restart').style.display = 'block';
            }
            items.splice(index, 1);
            updateScoreboard();
        }
    });

    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(index, 1);
    });
}

function collides(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function updateScoreboard() {
    document.getElementById('score').textContent = score;
    document.getElementById('bananaScore').textContent = `${bananaCount} / ${bananaGoal}`;
    document.getElementById('waterScore').textContent = `${waterCount} / ${waterGoal}`;
    document.getElementById('bananaMeter').style.width = `${Math.max(0, (bananaCount / bananaGoal) * 100)}%`;
    document.getElementById('waterMeter').style.width = `${Math.max(0, (waterCount / waterGoal) * 100)}%`;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameStarted) {
        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
        
        items.forEach(item => {
            ctx.drawImage(item.img, item.x, item.y, item.width, item.height);
        });

        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });
    }
}

function gameLoop() {
    if (gameStarted) {
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

// Start game loop (shows instructions initially)
gameLoop();