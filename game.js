// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Initialize width and height variables
let width = canvas.width;
let height = canvas.height;

// Set canvas to fullscreen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    width = canvas.width;
    height = canvas.height;
    
    // Reposition player to center of new screen
    if (player) {
        player.x = width / 2;
        player.y = height - 100;
    }
}

// Update canvas size on window resize
window.addEventListener('resize', resizeCanvas);

// Game State
let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    paused: false,
    cameraShake: 0,
    cameraShakeIntensity: 0,
    performanceMode: false // Track if we're in performance mode
};

// Input Handling
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ' && gameState.gameOver) {
        resetGame();
    }
    if (e.key === 'Escape') {
        gameState.paused = !gameState.paused;
        const pauseScreen = document.getElementById('pauseScreen');
        if (gameState.paused) {
            pauseScreen.style.display = 'block';
        } else {
            pauseScreen.style.display = 'none';
        }
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Starfield System
class Star {
    constructor(x, y, speed, size, brightness) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.size = size;
        this.brightness = brightness;
        this.twinkle = Math.random() * Math.PI * 2;
        this.twinkleSpeed = 0.02 + Math.random() * 0.03;
    }

    update() {
        this.y += this.speed;
        this.twinkle += this.twinkleSpeed;
        
        if (this.y > height) {
            this.y = -10;
            this.x = Math.random() * width;
        }
    }

    draw() {
        const twinkleFactor = 0.5 + 0.5 * Math.sin(this.twinkle);
        const alpha = this.brightness * twinkleFactor;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#535353';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Planet System
class Planet {
    constructor(x, y, radius, color, rotationSpeed) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.rotationSpeed = rotationSpeed;
        this.rotation = 0;
        this.rings = Math.random() > 0.5;
    }

    update() {
        this.rotation += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        
        // Planet body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Planet outline
        ctx.strokeStyle = '#535353';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Planet rings
        if (this.rings) {
            ctx.strokeStyle = '#535353';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.radius * 1.8, this.radius * 0.3, this.rotation, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// Nebula System
class Nebula {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.opacity = 0.1 + Math.random() * 0.2;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.01 + Math.random() * 0.02;
    }

    update() {
        this.pulse += this.pulseSpeed;
    }

    draw() {
        const pulseFactor = 0.7 + 0.3 * Math.sin(this.pulse);
        ctx.save();
        ctx.globalAlpha = this.opacity * pulseFactor;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        ctx.restore();
    }
}

// Player Spaceship
class Player {
         constructor() {
         this.x = width / 2;
         this.y = height - 100;
         this.width = 40;
         this.height = 60;
         this.speed = 10; // Increased from 5 to 8 (60% faster!)
         this.health = 100;
         this.lastShot = 0;
         this.shotCooldown = 200;
         this.engineGlow = 0;
     }

    update() {
        // Movement
        if (keys['w'] || keys['arrowup']) this.y -= this.speed;
        if (keys['s'] || keys['arrowdown']) this.y += this.speed;
        if (keys['a'] || keys['arrowleft']) this.x -= this.speed;
        if (keys['d'] || keys['arrowright']) this.x += this.speed;
        
        // Boundaries
        this.x = Math.max(this.width/2, Math.min(width - this.width/2, this.x));
        this.y = Math.max(this.height/2, Math.min(height - this.height/2, this.y));
        
        // Shooting
        if (keys[' '] && Date.now() - this.lastShot > this.shotCooldown) {
            this.shoot();
            this.lastShot = Date.now();
        }
        
        this.engineGlow += 0.1;
    }

    shoot() {
        projectiles.push(new Projectile(this.x, this.y - this.height/2, 0, -10, '#535353'));
    }

    draw() {
        ctx.save();
        
        // Ship body
        ctx.fillStyle = '#535353';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height/2);
        ctx.lineTo(this.x - this.width/2, this.y + this.height/2);
        ctx.lineTo(this.x + this.width/2, this.y + this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Ship outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height/2);
        ctx.lineTo(this.x - this.width/2, this.y + this.height/2);
        ctx.lineTo(this.x + this.width/2, this.y + this.height/2);
        ctx.closePath();
        ctx.stroke();
        
        // Ship details
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.height/4, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Projectile System
class Projectile {
    constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.width = 4;
        this.height = 12;
        this.life = 100;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw() {
        ctx.save();
        
        // Projectile core
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Projectile outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        ctx.restore();
    }
}

// Asteroid System
class Asteroid {
         constructor(x, y, size, type) {
         this.x = x;
         this.y = y;
         this.size = size;
         this.type = type;
         this.vx = (Math.random() - 0.5) * 4;
         this.vy = (Math.random() - 0.5) * 4;
         this.rotation = 0;
         this.rotationSpeed = (Math.random() - 0.5) * 0.1;
         this.health = size;
         this.maxHealth = size;
         this.hasDivided = false; // Track if this asteroid has already divided
         
         // Generate shape based on type
         this.vertices = this.generateShape();
     }

    generateShape() {
        const vertices = [];
        const numVertices = 8 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < numVertices; i++) {
            const angle = (i / numVertices) * Math.PI * 2;
            const radius = this.size * (0.7 + Math.random() * 0.6);
            vertices.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        
        return vertices;
    }

         update() {
         this.x += this.vx;
         this.y += this.vy;
         this.rotation += this.rotationSpeed;
         
         // Wrap around left/right, but NOT top/bottom
         if (this.x < -this.size) this.x = width + this.size;
         if (this.x > width + this.size) this.x = -this.size;
         
         // Bounce off top and bottom boundaries instead of wrapping
         if (this.y < -this.size) {
             this.y = -this.size;
             this.vy = Math.abs(this.vy); // Bounce down
         }
         if (this.y > height + this.size) { // Bounce off actual bottom of screen
             this.y = height + this.size;
             this.vy = -Math.abs(this.vy); // Bounce up
         }
     }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw asteroid shape
        ctx.fillStyle = this.getColor();
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Asteroid outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Health indicator
        const healthPercent = this.health / this.maxHealth;
        if (healthPercent < 1) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-this.size, -this.size - 10, this.size * 2 * healthPercent, 4);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(-this.size, -this.size - 10, this.size * 2, 4);
        }
        
        ctx.restore();
    }

    getColor() {
        switch(this.type) {
            case 'rock': return '#808080'; // grey
            case 'crystal': return '#000000'; // black
            case 'metallic': return '#E8E8E8'; // whitish grey
            case 'white': return '#FFFFFF'; // white
            case 'transparent': return 'transparent'; // transparent
            default: return '#FFFFFF'; // white
        }
    }

    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }
}

// Particle System
class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = 2 + Math.random() * 4;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life--;
    }

    draw() {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Particle outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
}

// Game Objects
let player;
let projectiles = [];
let asteroids = [];
let particles = [];
let stars = [];
let planets = [];
let nebulas = [];

// Initialize game objects
function initGame() {
    // Create player
    player = new Player();
    
         // Create starfield (reduced for performance)
     for (let i = 0; i < 100; i++) { // Reduced from 200 to 100
         stars.push(new Star(
             Math.random() * width,
             Math.random() * height,
             0.5 + Math.random() * 2,
             1 + Math.random() * 3,
             0.3 + Math.random() * 0.7
         ));
     }
     
     // Create planets (reduced for performance)
     for (let i = 0; i < 2; i++) { // Reduced from 3 to 2
         planets.push(new Planet(
             Math.random() * width,
             Math.random() * height,
             30 + Math.random() * 50,
             '#e0e0e0',
             0.005 + Math.random() * 0.01
         ));
     }
     
     // Create nebulas (reduced for performance)
     for (let i = 0; i < 3; i++) { // Reduced from 5 to 3
         nebulas.push(new Nebula(
             Math.random() * width,
             Math.random() * height,
             100 + Math.random() * 200,
             100 + Math.random() * 200,
             '#d0d0d0'
         ));
     }
}

// Spawn asteroids
function spawnAsteroids() {
    const asteroidTypes = ['rock', 'crystal', 'metallic', 'white', 'transparent'];
    const numAsteroids = 2 + gameState.level; // Reduced from 5 + level*2 to 2 + level
    
    for (let i = 0; i < numAsteroids; i++) {
        const type = asteroidTypes[Math.floor(Math.random() * asteroidTypes.length)];
        const size = 20 + Math.random() * 40;
        
        // Spawn asteroids from top, left, or right edges, but not from bottom
        let x, y;
        const spawnSide = Math.floor(Math.random() * 3); // 0: top, 1: left, 2: right
        
        switch(spawnSide) {
            case 0: // Top edge
                x = Math.random() * width;
                y = -size;
                break;
            case 1: // Left edge
                x = -size;
                y = Math.random() * (height - 300); // Much larger buffer from bottom
                break;
            case 2: // Right edge
                x = width + size;
                y = Math.random() * (height - 300); // Much larger buffer from bottom
                break;
        }
        
        asteroids.push(new Asteroid(x, y, size, type));
    }
}

    // Create explosion particles
    function createExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#535353',
                30 + Math.random() * 30
            ));
        }
    }

// Camera shake
function addCameraShake(intensity) {
    gameState.cameraShake = 10;
    gameState.cameraShakeIntensity = intensity;
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update game
function update() {
    if (gameState.paused || gameState.gameOver) return;
    
    // Update camera shake
    if (gameState.cameraShake > 0) {
        gameState.cameraShake--;
    }
    
    // Update stars
    stars.forEach(star => star.update());
    
    // Update planets
    planets.forEach(planet => planet.update());
    
    // Update nebulas
    nebulas.forEach(nebula => nebula.update());
    
    // Update player
    if (player) {
        player.update();
    }
    
    // Update projectiles
    projectiles = projectiles.filter(proj => {
        proj.update();
        return proj.life > 0 && proj.x > 0 && proj.x < width && proj.y > 0 && proj.y < height;
    });
    
         // Update asteroids
     asteroids = asteroids.filter(asteroid => {
         asteroid.update();
         
         // Remove asteroids that are too far below the screen
         if (asteroid.y > height + 200) { // Only remove when way below screen
             return false;
         }
         
         return asteroid.health > 0;
     });
     
     // Check asteroid-to-asteroid collisions and bounce them off each other
     for (let i = 0; i < asteroids.length; i++) {
         for (let j = i + 1; j < asteroids.length; j++) {
             const asteroid1 = asteroids[i];
             const asteroid2 = asteroids[j];
             
             // Calculate distance between asteroid centers
             const dx = asteroid2.x - asteroid1.x;
             const dy = asteroid2.y - asteroid1.y;
             const distance = Math.sqrt(dx * dx + dy * dy);
             
             // Check if asteroids are colliding
             if (distance < asteroid1.size + asteroid2.size) {
                 // Collision detected - bounce them off each other
                 
                 // Normalize the collision vector
                 const nx = dx / distance;
                 const ny = dy / distance;
                 
                 // Move asteroids apart to prevent sticking
                 const overlap = (asteroid1.size + asteroid2.size) - distance;
                 const moveX = nx * overlap * 0.5;
                 const moveY = ny * overlap * 0.5;
                 
                 asteroid1.x -= moveX;
                 asteroid1.y -= moveY;
                 asteroid2.x += moveX;
                 asteroid2.y += moveY;
                 
                 // Calculate relative velocity
                 const dvx = asteroid2.vx - asteroid1.vx;
                 const dvy = asteroid2.vy - asteroid1.vy;
                 
                 // Calculate velocity along collision normal
                 const velocityAlongNormal = dvx * nx + dvy * ny;
                 
                 // Only bounce if asteroids are moving toward each other
                 if (velocityAlongNormal < 0) {
                     // Calculate bounce force (elastic collision)
                     const bounceForce = -velocityAlongNormal * 0.8; // 0.8 = bounce elasticity
                     
                     // Apply bounce force to both asteroids
                     asteroid1.vx -= nx * bounceForce;
                     asteroid1.vy -= ny * bounceForce;
                     asteroid2.vx += nx * bounceForce;
                     asteroid2.vy += ny * bounceForce;
                     
                     // Add some randomness to prevent asteroids from getting stuck in patterns
                     asteroid1.vx += (Math.random() - 0.5) * 0.5;
                     asteroid1.vy += (Math.random() - 0.5) * 0.5;
                     asteroid2.vx += (Math.random() - 0.5) * 0.5;
                     asteroid2.vy += (Math.random() - 0.5) * 0.5;
                 }
             }
         }
     }
    
    // Update particles
    particles = particles.filter(particle => {
        particle.update();
        return particle.life > 0;
    });
    
    // Collision detection
    projectiles.forEach((proj, projIndex) => {
        asteroids.forEach((asteroid, asteroidIndex) => {
            if (checkCollision(
                {x: proj.x - proj.width/2, y: proj.y - proj.height/2, width: proj.width, height: proj.height},
                {x: asteroid.x - asteroid.size, y: asteroid.y - asteroid.size, width: asteroid.size * 2, height: asteroid.size * 2}
            )) {
                // Remove projectile
                projectiles.splice(projIndex, 1);
                
                // Damage asteroid
                if (asteroid.takeDamage(25)) {
                    // Asteroid destroyed
                    createExplosion(asteroid.x, asteroid.y, asteroid.getColor(), 30);
                    gameState.score += asteroid.size * 10;
                    addCameraShake(asteroid.size / 10);
                    
                                         // Spawn smaller asteroids (only if original was large enough AND we don't have too many)
                     if (asteroid.size > 30 && asteroids.length < 8) { // Increased size requirement and reduced limit
                         for (let i = 0; i < 2; i++) {
                             // Ensure smaller asteroids don't spawn below the player area
                             let spawnX = asteroid.x + (Math.random() - 0.5) * 20;
                             let spawnY = asteroid.y + (Math.random() - 0.5) * 20;
                             
                             // If the spawn position is too low, move it up
                             if (spawnY > height - 250) {
                                 spawnY = height - 250;
                             }
                             
                             // Create smaller asteroid with division flag
                             const smallerAsteroid = new Asteroid(
                                 spawnX,
                                 spawnY,
                                 asteroid.size * 0.6,
                                 asteroid.type
                             );
                             smallerAsteroid.hasDivided = true; // Mark as already divided
                             
                             asteroids.push(smallerAsteroid);
                         }
                     }
                }
            }
        });
    });
    
    // Check player collision with asteroids
    if (player) {
        asteroids.forEach(asteroid => {
            if (checkCollision(
                {x: player.x - player.width/2, y: player.y - player.height/2, width: player.width, height: player.height},
                {x: asteroid.x - asteroid.size, y: asteroid.y - asteroid.size, width: asteroid.size * 2, height: asteroid.size * 2}
            )) {
            // Player hit
            createExplosion(player.x, player.y, '#535353', 40);
            gameState.lives--;
            addCameraShake(5);
            
            // Remove asteroid
            asteroid.health = 0;
            
                         if (gameState.lives <= 0) {
                 gameState.gameOver = true;
                 document.getElementById('gameOver').style.display = 'block';
             }
         }
        });
    }
    
         // Spawn new asteroids if needed (with performance limit)
     if (asteroids.length < Math.min(3 + gameState.level, 12)) { // Reduced max from 20 to 12
         spawnAsteroids();
     }
    
    // Update UI
    const scoreElement = document.getElementById('score');
    const newScore = gameState.score.toLocaleString();
    if (scoreElement.textContent !== newScore) {
        scoreElement.textContent = newScore;
        scoreElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            scoreElement.style.transform = 'scale(1)';
        }, 200);
    }
    
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('level').textContent = gameState.level;
    
    // Update UI bars
    const livesBar = document.getElementById('livesBar');
    const levelBar = document.getElementById('levelBar');
    
    // Lives bar (percentage of max lives)
    const livesPercent = (gameState.lives / 3) * 100;
    livesBar.style.width = livesPercent + '%';
    
    // Level progress bar
    const levelProgress = (gameState.score % 1000) / 1000 * 100;
    levelBar.style.width = levelProgress + '%';
    
    // Level progression
    if (gameState.score > gameState.level * 1000) {
        gameState.level++;
        spawnAsteroids();
    }
}

    // Draw game
    function draw() {
        // Clear canvas
        ctx.fillStyle = '#f7f7f7';
        ctx.fillRect(0, 0, width, height);
    
    // Apply camera shake
    if (gameState.cameraShake > 0) {
        const shakeX = (Math.random() - 0.5) * gameState.cameraShakeIntensity;
        const shakeY = (Math.random() - 0.5) * gameState.cameraShakeIntensity;
        ctx.save();
        ctx.translate(shakeX, shakeY);
    }
    
    // Draw nebulas (background) - skip in performance mode
    if (!gameState.performanceMode) {
        nebulas.forEach(nebula => nebula.draw());
    }
    
    // Draw stars (skip some in performance mode)
    stars.forEach((star, index) => {
        if (star && (!gameState.performanceMode || index % 2 === 0)) {
            star.draw();
        }
    });
    
    // Draw planets - skip in performance mode
    if (!gameState.performanceMode) {
        planets.forEach(planet => planet.draw());
    }
    
    // Draw particles
    particles.forEach(particle => particle.draw());
    
    // Draw asteroids
    asteroids.forEach(asteroid => {
        if (asteroid) asteroid.draw();
    });
    
    // Draw projectiles
    projectiles.forEach(proj => proj.draw());
    
    // Draw player
    if (player) {
        player.draw();
    }
    
    // Restore camera shake
    if (gameState.cameraShake > 0) {
        ctx.restore();
    }
}

// Performance monitoring
let lastFrameTime = 0;
let frameCount = 0;
let fps = 60;

// Game loop
function gameLoop(currentTime) {
    // Calculate FPS
    if (lastFrameTime > 0) {
        const deltaTime = currentTime - lastFrameTime;
        fps = 1000 / deltaTime;
        
        // Enter performance mode if FPS drops below 30
        if (fps < 30 && !gameState.performanceMode) {
            gameState.performanceMode = true;
            console.log('Entering performance mode - reducing visual effects');
        }
        // Exit performance mode if FPS recovers
        else if (fps > 50 && gameState.performanceMode) {
            gameState.performanceMode = false;
            console.log('Exiting performance mode - restoring visual effects');
        }
    }
    lastFrameTime = currentTime;
    
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Reset game
function resetGame() {
    gameState = {
        score: 0,
        lives: 3,
        level: 1,
        gameOver: false,
        paused: false,
        cameraShake: 0,
        cameraShakeIntensity: 0,
        performanceMode: false
    };
    
    player = new Player();
    projectiles = [];
    asteroids = [];
    particles = [];
    
    document.getElementById('gameOver').style.display = 'none';
    
    spawnAsteroids();
}

// Initialize and start game
// Make sure canvas is properly sized before starting
setTimeout(() => {
    resizeCanvas(); // Initialize canvas size first
    initGame();
    spawnAsteroids();
    gameLoop();
}, 100); 