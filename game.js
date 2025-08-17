// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Initialize width and height variables
let width = canvas.width;
let height = canvas.height;

// Performance monitoring
let lastFrameTime = 0;
let frameCount = 0;
let fps = 60;
let frameTime = 16.67; // Target 60 FPS

// Set canvas to fullscreen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    width = canvas.width;
    height = canvas.height;
    
    // Reposition player to center of new screen
    if (player) {
        player.x = Math.max(player.width/2, Math.min(width - player.width/2, player.x));
        player.y = Math.max(player.height/2, Math.min(height - player.height/2, player.y));
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
    performanceMode: false,
    screenFlash: 0,
    screenFlashColor: '#ff6600',
    lastExplosionMilestone: 0,
    maxAsteroids: 15, // Limit total asteroids
    maxParticles: 200, // Limit total particles
    maxProjectiles: 50, // Limit total projectiles
    highScore: 0 // Track high score
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
    
    // Testing shortcuts (remove in production)
    if (e.key === 't' && e.ctrlKey) {
        e.preventDefault();
        testHighScoreSystem();
    }
    if (e.key === 'r' && e.ctrlKey) {
        e.preventDefault();
        resetHighScore();
        console.log('High score reset. Refresh the page to see changes.');
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Object Pool for better performance
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 20) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];
        
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }
    
    get() {
        if (this.pool.length > 0) {
            const obj = this.pool.pop();
            this.active.push(obj);
            return obj;
        } else {
            const obj = this.createFn();
            this.active.push(obj);
            return obj;
        }
    }
    
    release(obj) {
        const index = this.active.indexOf(obj);
        if (index > -1) {
            this.active.splice(index, 1);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }
    
    update() {
        // Update all active objects and remove dead ones
        for (let i = this.active.length - 1; i >= 0; i--) {
            const obj = this.active[i];
            obj.update();
            if (obj.life <= 0 || obj.shouldRemove()) {
                this.release(obj);
            }
        }
    }
    
    draw() {
        this.active.forEach(obj => obj.draw());
    }
    
    clear() {
        this.active.forEach(obj => this.resetFn(obj));
        this.pool.push(...this.active);
        this.active = [];
    }
}

// Starfield System
class Star {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.speed = 0.5 + Math.random() * 2;
        this.size = 1 + Math.random() * 3;
        this.brightness = 0.3 + Math.random() * 0.7;
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
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.radius = 30 + Math.random() * 50;
        this.color = '#e0e0e0';
        this.rotationSpeed = 0.005 + Math.random() * 0.01;
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
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.width = 100 + Math.random() * 200;
        this.height = 100 + Math.random() * 200;
        this.color = '#d0d0d0';
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
        this.speed = 10;
        this.health = 100;
        this.lastShot = 0;
        this.shotCooldown = 200;
        this.engineGlow = 0;
        
        // Power-ups
        this.shieldHp = 0;
        this.shieldMaxHp = 120;
        this.spreadShotUntil = 0;
        this.canDashUntil = 0;
        this.dashing = false;
        this.dashEndAt = 0;
        this.dashCooldownMs = 800;
        this.lastDashAt = 0;
        this.dashSpeed = 28;
        this.explosionPowerAvailable = false;
        
        // New weapon systems
        this.chargeShotAvailable = false;
        this.chargeShotLevel = 0; // 0-3 levels
        this.chargeShotCooldown = 0;
        this.homingMissiles = 0; // Limited ammo
        this.homingMissileCooldown = 0;
        this.lastHomingShot = 0;
        this.spreadCount = 1; // Track number of spread shots
    }

    update() {
        // Movement
        let moveX = 0, moveY = 0;
        if (keys['w'] || keys['arrowup']) moveY -= 1;
        if (keys['s'] || keys['arrowdown']) moveY += 1;
        if (keys['a'] || keys['arrowleft']) moveX -= 1;
        if (keys['d'] || keys['arrowright']) moveX += 1;
        
        // Normalize
        if (moveX !== 0 || moveY !== 0) {
            const len = Math.sqrt(moveX * moveX + moveY * moveY); // Use sqrt instead of hypot for performance
            moveX /= len; moveY /= len;
        }
        
        // Dash trigger
        const now = Date.now();
        const dashActiveWindow = now < this.canDashUntil;
        if (dashActiveWindow && (keys['shift'] || keys['shiftleft']) && now - this.lastDashAt > this.dashCooldownMs) {
            this.dashing = true;
            this.dashEndAt = now + 180;
            this.lastDashAt = now;
            if (moveX === 0 && moveY === 0) { moveY = -1; }
        }
        
        // Explosion power trigger
        if (keys['q'] && this.explosionPowerAvailable) {
            this.triggerExplosionPower();
        }
        
        // Base movement
        this.x += moveX * this.speed;
        this.y += moveY * this.speed;
        
        // Extra movement while dashing
        if (this.dashing) {
            this.x += moveX * this.dashSpeed;
            this.y += moveY * this.dashSpeed;
            if (now > this.dashEndAt) this.dashing = false;
        }
        
        // Boundaries
        this.x = Math.max(this.width/2, Math.min(width - this.width/2, this.x));
        this.y = Math.max(this.height/2, Math.min(height - this.height/2, this.y));
        
        // Shooting
        if (keys[' '] && now - this.lastShot > this.shotCooldown) {
            this.shoot();
            this.lastShot = now;
        }
        
        // Charge shot system
        if (keys[' '] && this.chargeShotAvailable) {
            this.chargeShotLevel = Math.min(3, this.chargeShotLevel + 0.1);
        } else if (this.chargeShotLevel > 0) {
            // Fire charge shot when space is released
            if (this.chargeShotLevel >= 1) {
                this.fireChargeShot();
            }
            this.chargeShotLevel = 0;
        }
        
        // Homing missile system
        if (keys['h'] && this.homingMissiles > 0 && now - this.lastHomingShot > 500) {
            this.fireHomingMissile();
            this.lastHomingShot = now;
        }
        
        this.engineGlow += 0.1;
    }

    triggerExplosionPower() {
        this.explosionPowerAvailable = false;
        
        // Create massive explosion effect
        createExplosion(this.x, this.y, '#ff6600', 200);
        addCameraShake(25);
        
        // Destroy ALL asteroids on screen
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i];
            createExplosion(asteroid.x, asteroid.y, asteroid.getColor(), 40);
            gameState.score += asteroid.size * 10;
            asteroids.splice(i, 1);
        }
        
        gameState.screenFlash = 20;
    }

    shoot() {
        const now = Date.now();
        const spreadActive = now < this.spreadShotUntil;
        
        if (spreadActive) {
            // Get current spread count (default to 1 if not set)
            const spreadCount = this.spreadCount || 1;
            const totalProjectiles = spreadCount * 3; // 3 projectiles per level
            
            console.log(`Firing spread shot: ${totalProjectiles} projectiles (${spreadCount}x3)`);
            
            // Calculate spacing based on total projectiles
            const spacing = 8; // Base spacing between projectiles
            const totalWidth = (totalProjectiles - 1) * spacing;
            const startX = -totalWidth / 2;
            
            for (let i = 0; i < totalProjectiles; i++) {
                const vx = startX + (i * spacing);
                const proj = projectilePool.get();
                proj.init(this.x + vx, this.y - this.height/2, vx * 0.3, -10, '#535353');
            }
        } else {
            const proj = projectilePool.get();
            proj.init(this.x, this.y - this.height/2, 0, -10, '#535353');
        }
    }

    draw() {
        ctx.save();
        
        // Shield visual
        if (this.shieldHp > 0) {
            const shieldAlpha = Math.min(0.4, 0.2 + this.shieldHp / this.shieldMaxHp * 0.2);
            ctx.fillStyle = `rgba(150,150,150,${shieldAlpha})`;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(this.width, this.height) * 0.75, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Warning effect when shield is low
            if (this.shieldHp < this.shieldMaxHp * 0.3) {
                const warningAlpha = 0.3 + 0.2 * Math.sin(Date.now() * 0.01);
                ctx.strokeStyle = `rgba(255,0,0,${warningAlpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, Math.max(this.width, this.height) * 0.75, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        // Explosion power indicator
        if (this.explosionPowerAvailable) {
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.rect(0, 0, width, height);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Spread power-up stacking indicator
        const now = Date.now();
        if (now < this.spreadShotUntil) {
            const spreadCount = this.spreadCount || 1;
            
            if (spreadCount > 1) {
                // Show projectile count
                ctx.save();
                ctx.fillStyle = '#cc66cc';
                ctx.font = 'bold 16px Courier New';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const totalProjectiles = spreadCount * 3;
                ctx.fillText(`${totalProjectiles}`, this.x, this.y - this.height/2 - 25);
                
                // Add glow effect
                ctx.shadowColor = '#cc66cc';
                ctx.shadowBlur = 10;
                ctx.fillText(`${totalProjectiles}`, this.x, this.y - this.height/2 - 25);
                ctx.restore();
            }
        }
        
        // Ship body
        ctx.fillStyle = '#535353';
        
        // Flash red when shield is low (danger warning)
        if (this.shieldHp > 0 && this.shieldHp < this.shieldMaxHp * 0.3) {
            const dangerFlash = 0.5 + 0.5 * Math.sin(Date.now() * 0.02);
            ctx.fillStyle = `rgba(255, ${255 * (1 - dangerFlash)}, ${255 * (1 - dangerFlash)}, 0.8)`;
        }
        
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

    fireChargeShot() {
        if (!this.chargeShotAvailable) return;
        
        const chargeLevel = Math.min(3, this.chargeShotLevel);
        const damage = 50 + (chargeLevel * 25);
        const width = 8 + (chargeLevel * 4);
        const length = 100 + (chargeLevel * 50);
        
        console.log(`Firing charge shot! Level: ${chargeLevel.toFixed(1)}, Damage: ${damage}`);
        
        // Create piercing beam projectile
        const chargeProj = new ChargeProjectile();
        chargeProj.init(this.x, this.y - this.height/2, 0, -15, '#00ffff', damage, width, length, chargeLevel);
        projectilePool.active.push(chargeProj);
        
        // Visual and audio effects
        createExplosion(this.x, this.y - this.height/2, '#00ffff', 20);
        addCameraShake(chargeLevel * 2);
        
        // Cooldown
        this.chargeShotCooldown = Date.now() + 2000;
    }
    
    fireHomingMissile() {
        if (this.homingMissiles <= 0) return;
        
        this.homingMissiles--;
        console.log(`Firing homing missile! Ammo remaining: ${this.homingMissiles}`);
        
        // Find nearest target
        let nearestTarget = null;
        let nearestDistance = Infinity;
        
        asteroids.forEach(asteroid => {
            const dx = asteroid.x - this.x;
            const dy = asteroid.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestTarget = asteroid;
            }
        });
        
        if (nearestTarget) {
            const homingMissile = new HomingMissile();
            homingMissile.init(this.x, this.y - this.height/2, nearestTarget);
            projectilePool.active.push(homingMissile);
            
            // Visual effect
            createExplosion(this.x, this.y - this.height/2, '#ff00ff', 15);
        }
    }
}

// Projectile System
class Projectile {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.color = '#535353';
        this.width = 4;
        this.height = 12;
        this.life = 100;
    }
    
    init(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = 100;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    
    shouldRemove() {
        return this.life <= 0 || this.x < 0 || this.x > width || this.y < 0 || this.y > height;
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

// Charge Projectile System (Piercing Beam)
class ChargeProjectile {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.color = '#00ffff';
        this.damage = 75;
        this.width = 12;
        this.length = 150;
        this.chargeLevel = 1;
        this.life = 120;
        this.piercedTargets = [];
    }
    
    init(x, y, vx, vy, color, damage, width, length, chargeLevel) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.damage = damage;
        this.width = width;
        this.length = length;
        this.chargeLevel = chargeLevel;
        this.life = 120;
        this.piercedTargets = [];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    
    shouldRemove() {
        return this.life <= 0 || this.x < 0 || this.x > width || this.y < 0 || this.y > height;
    }

    draw() {
        ctx.save();
        
        // Beam trail effect
        const trailLength = this.length * 0.3;
        for (let i = 0; i < 3; i++) {
            const alpha = 0.3 - (i * 0.1);
            const offset = i * 2;
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.fillRect(
                this.x - this.width/2 + offset, 
                this.y - this.length/2, 
                this.width - (offset * 2), 
                this.length
            );
        }
        
        // Main beam
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x - this.width/2, 
            this.y - this.length/2, 
            this.width, 
            this.length
        );
        
        // Beam glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(
            this.x - this.width/2, 
            this.y - this.length/2, 
            this.width, 
            this.length
        );
        
        // Charge level indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`L${this.chargeLevel.toFixed(0)}`, this.x, this.y);
        
        ctx.restore();
    }
    
    // Check if this projectile has already hit a target
    hasHitTarget(targetId) {
        return this.piercedTargets.includes(targetId);
    }
    
    // Add target to pierced list
    addPiercedTarget(targetId) {
        this.piercedTargets.push(targetId);
    }
}

// Homing Missile System
class HomingMissile {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.speed = 8;
        this.target = null;
        this.life = 150;
        this.turnRate = 0.1;
        this.trail = [];
    }
    
    init(x, y, target) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.vx = 0;
        this.vy = -this.speed;
        this.life = 150;
        this.trail = [];
    }

    update() {
        // Update trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 10) {
            this.trail.shift();
        }
        
        // Homing logic
        if (this.target && this.target.health > 0) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const targetVx = (dx / distance) * this.speed;
                const targetVy = (dy / distance) * this.speed;
                
                // Gradually turn towards target
                this.vx += (targetVx - this.vx) * this.turnRate;
                this.vy += (targetVy - this.vy) * this.turnRate;
                
                // Normalize velocity
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                this.vx = (this.vx / speed) * this.speed;
                this.vy = (this.vy / speed) * this.speed;
            }
        }
        
        // Move missile
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    
    shouldRemove() {
        return this.life <= 0 || this.x < 0 || this.x > width || this.y < 0 || this.y > height;
    }

    draw() {
        ctx.save();
        
        // Draw trail
        this.trail.forEach((pos, index) => {
            const alpha = (index / this.trail.length) * 0.6;
            ctx.fillStyle = `rgba(255, 0, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw missile body
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Missile glow
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Direction indicator
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.vx * 2, this.y + this.vy * 2);
        ctx.stroke();
        
        ctx.restore();
    }
}

// Asteroid System
class Asteroid {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.size = 20;
        this.type = 'rock';
        this.vx = 0;
        this.vy = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.health = 20;
        this.maxHealth = 20;
        this.hasDivided = false;
        this.vertices = [];
    }
    
    init(x, y, size, type) {
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
        this.hasDivided = false;
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
        
        // Wrap around left/right, bounce off top/bottom
        if (this.x < -this.size) this.x = width + this.size;
        if (this.x > width + this.size) this.x = -this.size;
        
        if (this.y < -this.size) {
            this.y = -this.size;
            this.vy = Math.abs(this.vy);
        }
        if (this.y > height + this.size) {
            this.y = height + this.size;
            this.vy = -Math.abs(this.vy);
        }
    }
    
    shouldRemove() {
        return this.health <= 0 || this.y > height + 200;
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
            case 'rock': return '#808080';
            case 'crystal': return '#000000';
            case 'metallic': return '#E8E8E8';
            case 'white': return '#FFFFFF';
            case 'transparent': return 'transparent';
            default: return '#FFFFFF';
        }
    }

    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }
}

// Particle System
class Particle {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.color = '#535353';
        this.life = 30;
        this.maxLife = 30;
        this.size = 2 + Math.random() * 4;
    }
    
    init(x, y, vx, vy, color, life = 30) {
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
    
    shouldRemove() {
        return this.life <= 0;
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

// PowerUp System
class PowerUp {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.type = 'shield';
        this.size = 18;
        this.vy = 2;
        this.pulse = 0;
        this.pulseSpeed = 0.1;
        this.collected = false;
    }
    
    init(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 18;
        this.vy = 2;
        this.pulse = 0;
        this.pulseSpeed = 0.1;
        this.collected = false;
    }
    
    update() {
        this.y += this.vy;
        this.pulse += this.pulseSpeed;
    }
    
    shouldRemove() {
        return this.y - this.size/2 > height + 50 || this.collected;
    }
    
    draw() {
        ctx.save();
        
        // Pulsing effect
        const pulseScale = 1 + 0.1 * Math.sin(this.pulse);
        ctx.translate(this.x, this.y);
        ctx.scale(pulseScale, pulseScale);
        
        // Icon background with glow effect
        const glowIntensity = 0.3 + 0.2 * Math.sin(this.pulse);
        ctx.shadowColor = this.getGlowColor();
        ctx.shadowBlur = 10 + glowIntensity * 5;
        
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.fill();
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Symbol
        ctx.fillStyle = '#000000';
        switch(this.type) {
            case 'shield':
                ctx.beginPath();
                ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 'dash':
                ctx.beginPath();
                ctx.moveTo(this.x - 6, this.y);
                ctx.lineTo(this.x + 6, this.y);
                ctx.stroke();
                break;
            case 'spread':
                ctx.beginPath();
                ctx.moveTo(this.x - 6, this.y + 6);
                ctx.lineTo(this.x, this.y - 6);
                ctx.lineTo(this.x + 6, this.y + 6);
                ctx.stroke();
                break;
            case 'charge':
                // Lightning bolt for charge shot
                ctx.beginPath();
                ctx.moveTo(this.x - 4, this.y - 6);
                ctx.lineTo(this.x + 2, this.y - 2);
                ctx.lineTo(this.x - 2, this.y + 2);
                ctx.lineTo(this.x + 4, this.y + 6);
                ctx.stroke();
                break;
            case 'homing':
                // Target symbol for homing missiles
                ctx.beginPath();
                ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(this.x, this.y, 1, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        // Power-up type label
        ctx.fillStyle = '#000000';
        ctx.font = '8px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(this.type.toUpperCase(), 0, this.size/2 + 12);
        
        ctx.restore();
    }
    
    getGlowColor() {
        switch(this.type) {
            case 'shield': return '#0066cc';
            case 'dash': return '#00cc66';
            case 'spread': return '#cc66cc';
            default: return '#ffff00';
        }
    }
    
    getSymbolColor() {
        switch(this.type) {
            case 'shield': return '#0066cc';
            case 'dash': return '#00cc66';
            case 'spread': return '#cc66cc';
            default: return '#000000';
        }
    }
}

// Game Objects
let player;
let asteroids = [];
let stars = [];
let planets = [];
let nebulas = [];
let powerUps = [];

// Object pools
let projectilePool;
let particlePool;
let powerUpPool;

// Initialize game objects
function initGame() {
    // Create player
    player = new Player();
    
    // Initialize object pools
    projectilePool = new ObjectPool(
        () => new Projectile(),
        (proj) => proj.reset(),
        gameState.maxProjectiles
    );
    
    particlePool = new ObjectPool(
        () => new Particle(),
        (particle) => particle.reset(),
        gameState.maxParticles
    );
    
    powerUpPool = new ObjectPool(
        () => new PowerUp(),
        (pu) => pu.reset(),
        20
    );
    
    // Create starfield
    for (let i = 0; i < 100; i++) {
        stars.push(new Star());
    }
    
    // Create planets
    for (let i = 0; i < 2; i++) {
        planets.push(new Planet());
    }
    
    // Create nebulas
    for (let i = 0; i < 3; i++) {
        nebulas.push(new Nebula());
    }
}

// Spawn asteroids with limits
function spawnAsteroids() {
    if (asteroids.length >= gameState.maxAsteroids) return;
    
    const asteroidTypes = ['rock', 'crystal', 'metallic', 'white', 'transparent'];
    const numAsteroids = Math.min(2 + gameState.level, gameState.maxAsteroids - asteroids.length);
    
    for (let i = 0; i < numAsteroids; i++) {
        const type = asteroidTypes[Math.floor(Math.random() * asteroidTypes.length)];
        const size = 20 + Math.random() * 40;
        
        let x, y;
        const spawnSide = Math.floor(Math.random() * 3);
        
        switch(spawnSide) {
            case 0: // Top edge
                x = Math.random() * width;
                y = -size;
                break;
            case 1: // Left edge
                x = -size;
                y = Math.random() * (height - 300);
                break;
            case 2: // Right edge
                x = width + size;
                y = Math.random() * (height - 300);
                break;
        }
        
        const asteroid = new Asteroid();
        asteroid.init(x, y, size, type);
        asteroids.push(asteroid);
    }
}

// Create explosion particles
function createExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        const particle = particlePool.get();
        particle.init(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            color,
            30 + Math.random() * 30
        );
    }
}

// Camera shake
function addCameraShake(intensity) {
    gameState.cameraShake = 10;
    gameState.cameraShakeIntensity = intensity;
}

// Optimized collision detection
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
    
    // Update background elements
    stars.forEach(star => star.update());
    planets.forEach(planet => planet.update());
    nebulas.forEach(nebula => nebula.update());
    
    // Update player
    if (player) {
        player.update();
    }
    
    // Update object pools
    projectilePool.update();
    particlePool.update();
    powerUpPool.update();
    
    // Update asteroids with proper cleanup
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        asteroid.update();
        
        if (asteroid.shouldRemove()) {
            asteroids.splice(i, 1);
        }
    }
    
    // Optimized asteroid-to-asteroid collisions (only check nearby asteroids)
    for (let i = 0; i < asteroids.length; i++) {
        const a1 = asteroids[i];
        for (let j = i + 1; j < asteroids.length; j++) {
            const a2 = asteroids[j];
            const dx = a2.x - a1.x;
            const dy = a2.y - a1.y;
            const distSq = dx * dx + dy * dy; // Use squared distance for performance
            const minDist = a1.size + a2.size;
            
            if (distSq < minDist * minDist) {
                const dist = Math.sqrt(distSq);
                const nx = dx / dist;
                const ny = dy / dist;
                const overlap = minDist - dist;
                const moveX = nx * overlap * 0.5;
                const moveY = ny * overlap * 0.5;
                
                a1.x -= moveX; a1.y -= moveY;
                a2.x += moveX; a2.y += moveY;
                
                const dvx = a2.vx - a1.vx;
                const dvy = a2.vy - a1.vy;
                const vAlong = dvx * nx + dvy * ny;
                
                if (vAlong < 0) {
                    const bounce = -vAlong * 0.8;
                    a1.vx -= nx * bounce; a1.vy -= ny * bounce;
                    a2.vx += nx * bounce; a2.vy += ny * bounce;
                    
                    // Add small random velocity
                    a1.vx += (Math.random() - 0.5) * 0.5;
                    a1.vy += (Math.random() - 0.5) * 0.5;
                    a2.vx += (Math.random() - 0.5) * 0.5;
                    a2.vy += (Math.random() - 0.5) * 0.5;
                }
            }
        }
    }
    
    // Pickup power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const pu = powerUps[i];
        if (checkCollision(
            {x: player.x - player.width/2, y: player.y - player.height/2, width: player.width, height: player.height},
            {x: pu.x - pu.size/2, y: pu.y - pu.size/2, width: pu.size, height: pu.size}
        )) {
            // Create collection effect
            createExplosion(pu.x, pu.y, '#ffff00', 15); // Yellow explosion for power-up collection
            addCameraShake(2);
            
            // Apply power-up effect
            if (pu.type === 'shield') {
                player.shieldHp = player.shieldMaxHp;
                // Show shield activation effect
                createExplosion(player.x, player.y, '#0066cc', 20);
            }
            if (pu.type === 'spread') {
                const now = Date.now();
                if (now < player.spreadShotUntil) {
                    // Spread is still active, increase projectile count
                    const additionalTime = 10000; // 10 seconds
                    player.spreadShotUntil += additionalTime;
                    
                    // Increase spread count (stored in player object) with limit
                    if (!player.spreadCount) player.spreadCount = 1;
                    const maxSpreadCount = 4; // Maximum 4x3 = 12 projectiles
                    if (player.spreadCount < maxSpreadCount) {
                        player.spreadCount++;
                    }
                    
                    const oldCount = player.spreadCount - 1;
                    const newCount = player.spreadCount;
                    const totalProjectiles = newCount * 3;
                    
                    if (newCount < maxSpreadCount) {
                        console.log(`Spread power-up enhanced!`);
                        console.log(`Old projectile count: ${oldCount * 3} (${oldCount}x3)`);
                        console.log(`New projectile count: ${totalProjectiles} (${newCount}x3)`);
                    } else {
                        console.log(`Spread power-up at maximum! Projectiles: ${totalProjectiles} (${newCount}x3)`);
                    }
                    
                    // Special effect for enhancing spread power-up
                    createExplosion(player.x, player.y, '#cc66cc', 30); // More particles
                    addCameraShake(3);
                    gameState.screenFlash = 8;
                    gameState.screenFlashColor = '#cc66cc'; // Purple flash for enhancement
                    
                    // Create enhancement indicator particles
                    for (let i = 0; i < 15; i++) {
                        const angle = (i / 15) * Math.PI * 2;
                        const speed = 2 + Math.random() * 3;
                        const particle = particlePool.get();
                        particle.init(
                            player.x, player.y,
                            Math.cos(angle) * speed,
                            Math.sin(angle) * speed,
                            '#cc66cc', // Purple particles
                            40 + Math.random() * 20
                        );
                    }
                    
                    // Show projectile count increase effect
                    setTimeout(() => {
                        createExplosion(player.x, player.y, '#ffff00', 20); // Yellow explosion for count increase
                    }, 200);
                } else {
                    // Spread has expired, start fresh
                    player.spreadShotUntil = now + 10000; // 10 seconds
                    player.spreadCount = 1; // Reset to base count
                    console.log('Spread power-up activated! Duration: 10s, Projectiles: 3 (1x3)');
                    
                    // Normal activation effect
                    createExplosion(player.x, player.y, '#cc66cc', 20);
                }
            }
            if (pu.type === 'dash') {
                player.canDashUntil = Date.now() + 8000;
                // Show dash activation effect
                createExplosion(player.x, player.y, '#00cc66', 20);
            }
            if (pu.type === 'charge') {
                player.chargeShotAvailable = true;
                player.chargeShotLevel = 0;
                console.log('Charge shot power-up activated!');
                // Show charge shot activation effect
                createExplosion(player.x, player.y, '#00ffff', 25);
            }
            if (pu.type === 'homing') {
                player.homingMissiles += 5; // Add 5 homing missiles
                console.log(`Homing missiles added! Total: ${player.homingMissiles}`);
                // Show homing missile activation effect
                createExplosion(player.x, player.y, '#ff00ff', 25);
            }
            
            // Mark power-up as collected
            pu.collected = true;
            
            // Remove power-up from screen
            powerUps.splice(i, 1);
            
            // Add screen flash to indicate power-up collected
            gameState.screenFlash = 5;
            gameState.screenFlashColor = '#ffff00'; // Yellow for power-up collection
        }
    }
    
    // Collision detection: projectiles vs asteroids
    projectilePool.active.forEach((proj, projIndex) => {
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i];
            if (checkCollision(
                {x: proj.x - proj.width/2, y: proj.y - proj.height/2, width: proj.width, height: proj.height},
                {x: asteroid.x - asteroid.size, y: asteroid.y - asteroid.size, width: asteroid.size * 2, height: asteroid.size * 2}
            )) {
                // Remove projectile
                projectilePool.release(proj);
                
                // Damage asteroid
                if (asteroid.takeDamage(25)) {
                    // Asteroid destroyed
                    createExplosion(asteroid.x, asteroid.y, asteroid.getColor(), 30);
                    gameState.score += asteroid.size * 10;
                    addCameraShake(asteroid.size / 10);
                    
                    // Chance to drop a power-up
                    if (Math.random() < 0.15) {
                        const kinds = ['shield', 'dash', 'spread', 'charge', 'homing'];
                        const kind = kinds[Math.floor(Math.random() * kinds.length)];
                        const pu = powerUpPool.get();
                        pu.init(asteroid.x, asteroid.y, kind);
                        powerUps.push(pu);
                    }
                    
                    // Spawn smaller asteroids
                    if (asteroid.size > 30 && asteroids.length < gameState.maxAsteroids - 2) {
                        for (let j = 0; j < 2; j++) {
                            let spawnX = asteroid.x + (Math.random() - 0.5) * 20;
                            let spawnY = asteroid.y + (Math.random() - 0.5) * 20;
                            if (spawnY > height - 250) { spawnY = height - 250; }
                            
                            const smallerAsteroid = new Asteroid();
                            smallerAsteroid.init(
                                spawnX,
                                spawnY,
                                asteroid.size * 0.6,
                                asteroid.type
                            );
                            smallerAsteroid.hasDivided = true;
                            asteroids.push(smallerAsteroid);
                        }
                    }
                    
                    // Remove destroyed asteroid
                    asteroids.splice(i, 1);
                }
                break; // Exit asteroid loop since projectile is destroyed
            }
        }
    });
    
    // Player vs asteroids
    if (player) {
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i];
            if (checkCollision(
                {x: player.x - player.width/2, y: player.y - player.height/2, width: player.width, height: player.height},
                {x: asteroid.x - asteroid.size, y: asteroid.y - asteroid.size, width: asteroid.size * 2, height: asteroid.size * 2}
            )) {
                if (player.shieldHp > 0) {
                    // Shield absorbs hit
                    createExplosion(asteroid.x, asteroid.y, asteroid.getColor(), 20);
                    asteroids.splice(i, 1);
                    player.shieldHp = Math.max(0, player.shieldHp - Math.max(20, asteroid.size * 0.5));
                    addCameraShake(3);
                } else {
                    // Player hit
                    createExplosion(player.x, player.y, '#535353', 40);
                    gameState.lives--;
                    addCameraShake(5);
                    asteroids.splice(i, 1);
                    
                    // Visual feedback for life lost
                    gameState.screenFlash = 15; // Longer red flash when hit
                    gameState.screenFlashColor = '#ff0000'; // Red for damage
                    
                    // Show remaining lives
                    if (gameState.lives > 0) {
                        // Create life lost indicator
                        createExplosion(player.x, player.y, '#ff0000', 25);
                        addCameraShake(8);
                    }
                    
                    if (gameState.lives <= 0) {
                        gameState.gameOver = true;
                        
                        // Check for high score
                        const highScoreResult = checkHighScore(gameState.score);
                        
                        // Update game over screen with score information
                        updateGameOverScreen(highScoreResult);
                        
                        document.getElementById('gameOver').style.display = 'block';
                        
                        // Final death effect
                        createExplosion(player.x, player.y, '#ff0000', 50);
                        addCameraShake(15);
                        gameState.screenFlash = 30;
                        gameState.screenFlashColor = '#ff0000'; // Red for death
                    }
                }
            }
        }
    }
    
    // Spawn new asteroids if needed
    if (asteroids.length < Math.min(3 + gameState.level, gameState.maxAsteroids)) {
        spawnAsteroids();
    }
    
    // Update UI
    updateUI();
    
    // Level progression
    if (gameState.score > gameState.level * 1000) {
        gameState.level++;
        spawnAsteroids();
    }

    // Grant explosion power every 7000 points
    const currentMilestone = Math.floor(gameState.score / 7000) * 7000;
    if (currentMilestone > gameState.lastExplosionMilestone && !player.explosionPowerAvailable) {
        gameState.lastExplosionMilestone = currentMilestone;
        player.explosionPowerAvailable = true;
    }
}

// Update UI (separated for better organization)
function updateUI() {
    const scoreElement = document.getElementById('score');
    const newScore = gameState.score.toLocaleString();
    if (scoreElement.textContent !== newScore) {
        scoreElement.textContent = newScore;
        scoreElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            scoreElement.style.transform = 'scale(1)';
        }, 200);
    }
    
    // Update high score display
    const currentHighScoreElement = document.getElementById('currentHighScore');
    if (currentHighScoreElement) {
        currentHighScoreElement.textContent = gameState.highScore.toLocaleString();
    }
    
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('level').textContent = gameState.level;
    
    // Update UI bars
    const livesBar = document.getElementById('livesBar');
    const levelBar = document.getElementById('levelBar');
    const livesPercent = (gameState.lives / 3) * 100;
    livesBar.style.width = livesPercent + '%';
    const levelProgress = (gameState.score % 1000) / 1000 * 100;
    levelBar.style.width = levelProgress + '%';
    
    // Update power-up UI
    const shieldBar = document.getElementById('shieldBar');
    const dashBar = document.getElementById('dashBar');
    const spreadBar = document.getElementById('spreadBar');
    const explosionBar = document.getElementById('explosionBar');
    const shieldStatus = document.getElementById('shieldStatus');
    const dashStatus = document.getElementById('dashStatus');
    const spreadStatus = document.getElementById('spreadStatus');
    const explosionStatus = document.getElementById('explosionStatus');
    
    // Shield status
    if (player.shieldHp > 0) {
        const shieldPercent = (player.shieldHp / player.shieldMaxHp) * 100;
        shieldBar.style.width = shieldPercent + '%';
        shieldStatus.textContent = Math.ceil(player.shieldHp);
    } else {
        shieldBar.style.width = '0%';
        shieldStatus.textContent = 'Inactive';
    }
    
    // Dash status
    const now = Date.now();
    if (now < player.canDashUntil) {
        const dashTimeLeft = player.canDashUntil - now;
        const dashPercent = (dashTimeLeft / 8000) * 100;
        dashBar.style.width = dashPercent + '%';
        dashStatus.textContent = Math.ceil(dashTimeLeft / 1000) + 's';
    } else {
        dashBar.style.width = '0%';
        dashStatus.textContent = 'Inactive';
    }
    
    // Spread-shot status
    if (now < player.spreadShotUntil) {
        const spreadTimeLeft = player.spreadShotUntil - now;
        const spreadPercent = (spreadTimeLeft / 10000) * 100; // Base duration is 10s
        spreadBar.style.width = spreadPercent + '%';
        
        // Show projectile count with indication of enhancement
        const spreadCount = player.spreadCount || 1;
        const totalProjectiles = spreadCount * 3;
        
        if (spreadCount > 1) {
            spreadStatus.textContent = `${Math.ceil(spreadTimeLeft / 1000)}s (${totalProjectiles} shots)`;
            spreadStatus.style.color = '#cc66cc'; // Purple for enhanced
            spreadStatus.style.fontWeight = 'bold';
            spreadStatus.style.textShadow = '0 0 5px #cc66cc';
        } else {
            spreadStatus.textContent = `${Math.ceil(spreadTimeLeft / 1000)}s (${totalProjectiles} shots)`;
            spreadStatus.style.color = '#535353'; // Normal color
            spreadStatus.style.fontWeight = 'normal';
            spreadStatus.style.textShadow = 'none';
        }
    } else {
        spreadBar.style.width = '0%';
        spreadStatus.textContent = 'Inactive';
        spreadStatus.style.color = '#535353';
    }
    
    // Explosion power status
    if (player.explosionPowerAvailable) {
        explosionBar.style.width = '100%';
        explosionStatus.textContent = 'Press Q';
    } else {
        explosionBar.style.width = '0%';
        explosionStatus.textContent = 'Inactive';
    }
    
    // Charge shot status
    const chargeShotBar = document.getElementById('chargeShotBar');
    const chargeShotStatus = document.getElementById('chargeShotStatus');
    if (player.chargeShotAvailable) {
        if (keys[' '] && player.chargeShotLevel > 0) {
            // Show charge level
            const chargePercent = (player.chargeShotLevel / 3) * 100;
            chargeShotBar.style.width = chargePercent + '%';
            chargeShotStatus.textContent = `L${player.chargeShotLevel.toFixed(1)}`;
        } else {
            chargeShotBar.style.width = '100%';
            chargeShotStatus.textContent = 'Hold SPACE';
        }
    } else {
        chargeShotBar.style.width = '0%';
        chargeShotStatus.textContent = 'Inactive';
    }
    
    // Homing missile status
    const homingMissileBar = document.getElementById('homingMissileBar');
    const homingMissileStatus = document.getElementById('homingMissileStatus');
    if (player.homingMissiles > 0) {
        homingMissileStatus.textContent = player.homingMissiles;
        homingMissileBar.style.width = '100%';
    } else {
        homingMissileStatus.textContent = '0';
        homingMissileBar.style.width = '0%';
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
    
    // Draw background elements (skip in performance mode)
    if (!gameState.performanceMode) {
        nebulas.forEach(nebula => nebula.draw());
        planets.forEach(planet => planet.draw());
    }
    
    // Draw stars (skip some in performance mode)
    stars.forEach((star, index) => {
        if (!gameState.performanceMode || index % 2 === 0) {
            star.draw();
        }
    });
    
    // Draw game objects using object pools
    particlePool.draw();
    powerUpPool.draw();
    powerUps.forEach(pu => pu.draw());
    asteroids.forEach(asteroid => asteroid.draw());
    projectilePool.draw();
    
    // Draw player
    if (player) {
        player.draw();
    }
    
    // Restore camera shake
    if (gameState.cameraShake > 0) {
        ctx.restore();
    }
    
    // Screen flash effect
    if (gameState.screenFlash > 0) {
        ctx.save();
        
        // Convert hex color to RGB
        let r, g, b;
        if (gameState.screenFlashColor.startsWith('#')) {
            const hex = gameState.screenFlashColor.substring(1);
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        } else {
            r = 255; g = 102; b = 0; // Default orange
        }
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${gameState.screenFlash / 10 * 0.3})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        gameState.screenFlash--;
    }
}

// Game loop with frame rate limiting
function gameLoop(currentTime) {
    // Calculate frame time and FPS
    if (lastFrameTime > 0) {
        frameTime = currentTime - lastFrameTime;
        fps = 1000 / frameTime;
        
        // Performance mode management
        if (fps < 30 && !gameState.performanceMode) {
            gameState.performanceMode = true;
            console.log('Entering performance mode - reducing visual effects');
        } else if (fps > 50 && gameState.performanceMode) {
            gameState.performanceMode = false;
            console.log('Exiting performance mode - restoring visual effects');
        }
    }
    lastFrameTime = currentTime;
    
    // Update and draw
    update();
    draw();
    
    // Request next frame with frame rate limiting
    requestAnimationFrame(gameLoop);
}

// Reset game
function resetGame() {
    // Store the current high score before resetting
    const currentHighScore = gameState.highScore;
    
    gameState = {
        score: 0, // Reset current score to 0
        lives: 3,
        level: 1,
        gameOver: false,
        paused: false,
        cameraShake: 0,
        cameraShakeIntensity: 0,
        performanceMode: false,
        screenFlash: 0,
        screenFlashColor: '#ff6600',
        lastExplosionMilestone: 0,
        maxAsteroids: 15,
        maxParticles: 200,
        maxProjectiles: 50,
        highScore: currentHighScore // Keep the high score persistent
    };
    
    player = new Player();
    asteroids = [];
    powerUps = [];
    
    // Clear object pools
    if (projectilePool) projectilePool.clear();
    if (particlePool) particlePool.clear();
    if (powerUpPool) powerUpPool.clear();
    
    document.getElementById('gameOver').style.display = 'none';
    
    console.log('Game reset. Current score: 0, High score maintained:', currentHighScore);
    console.log('Spread power-up reset to base: 3 projectiles');
    
    spawnAsteroids();
}

// Load high score from localStorage
function loadHighScore() {
    try {
        const saved = localStorage.getItem('cosmicAsteroidHighScore');
        if (saved) {
            gameState.highScore = parseInt(saved) || 0;
            console.log('High score loaded from localStorage:', gameState.highScore);
        } else {
            console.log('No previous high score found. Starting fresh!');
        }
    } catch (error) {
        console.log('Could not load high score:', error);
        gameState.highScore = 0;
    }
}

// Save high score to localStorage
function saveHighScore(score) {
    try {
        localStorage.setItem('cosmicAsteroidHighScore', score.toString());
        console.log('New high score saved to localStorage:', score);
    } catch (error) {
        console.log('Could not save high score:', error);
    }
}

// Reset high score (for testing)
function resetHighScore() {
    try {
        localStorage.removeItem('cosmicAsteroidHighScore');
        gameState.highScore = 0;
        console.log('High score reset to 0');
    } catch (error) {
        console.log('Could not reset high score:', error);
    }
}

// Test high score system
function testHighScoreSystem() {
    console.log('=== Testing High Score System ===');
    console.log('Current high score:', gameState.highScore);
    
    // Simulate multiple games
    console.log('\n--- Game 1: Score 100 ---');
    let result1 = checkHighScore(100);
    console.log('Result 1:', result1);
    console.log('High score after game 1:', gameState.highScore);
    
    console.log('\n--- Game 2: Score 97 ---');
    let result2 = checkHighScore(97);
    console.log('Result 2:', result2);
    console.log('High score after game 2:', gameState.highScore);
    
    console.log('\n--- Game 3: Score 200 ---');
    let result3 = checkHighScore(200);
    console.log('Result 3:', result3);
    console.log('High score after game 3:', gameState.highScore);
    
    console.log('\n--- Game 4: Score 150 ---');
    let result4 = checkHighScore(150);
    console.log('Result 4:', result4);
    console.log('High score after game 4:', gameState.highScore);
    
    console.log('\n=== Test Complete ===');
    console.log('Final high score:', gameState.highScore);
    console.log('Expected behavior: High score should be 200 (highest achieved)');
}

// Check and update high score
function checkHighScore(score) {
    console.log(`Checking high score: Current score = ${score}, Current high score = ${gameState.highScore}`);
    
    if (score > gameState.highScore) {
        const oldHighScore = gameState.highScore;
        gameState.highScore = score;
        saveHighScore(score);
        
        console.log(`🎉 NEW HIGH SCORE ACHIEVED! 🎉`);
        console.log(`Previous: ${oldHighScore} → New: ${score}`);
        
        // Celebrate new high score!
        celebrateNewHighScore(score, oldHighScore);
        
        return { isNew: true, old: oldHighScore, new: score };
    } else {
        console.log(`No new high score. Current: ${score}, High: ${gameState.highScore}`);
        return { isNew: false, current: gameState.highScore };
    }
}

// Celebrate new high score achievement
function celebrateNewHighScore(newScore, oldScore) {
    // Create celebration particles
    for (let i = 0; i < 50; i++) {
        const angle = (i / 50) * Math.PI * 2;
        const speed = 3 + Math.random() * 4;
        const particle = particlePool.get();
        particle.init(
            player.x, player.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            '#ffff00', // Gold color for celebration
            60 + Math.random() * 30
        );
    }
    
    // Add intense camera shake
    addCameraShake(20);
    
    // Special screen flash for new high score
    gameState.screenFlash = 25;
    gameState.screenFlashColor = '#ffff00'; // Gold flash
    
    // Play celebration sound effect (if available)
    console.log('🎉 NEW HIGH SCORE! 🎉');
    console.log(`Previous: ${oldScore.toLocaleString()} → New: ${newScore.toLocaleString()}`);
}

// Update game over screen with score information
function updateGameOverScreen(highScoreResult) {
    console.log('Updating game over screen with result:', highScoreResult);
    console.log('Current game score:', gameState.score);
    console.log('Persistent high score:', gameState.highScore);
    
    const gameOverScreen = document.getElementById('gameOver');
    const scoreElement = document.getElementById('finalScore');
    const highScoreElement = document.getElementById('highScore');
    const newHighScoreElement = document.getElementById('newHighScore');

    if (scoreElement) {
        scoreElement.textContent = gameState.score.toLocaleString();
        console.log('Final score displayed:', gameState.score);
    }

    if (highScoreElement) {
        highScoreElement.textContent = gameState.highScore.toLocaleString();
        console.log('High score displayed:', gameState.highScore);
    }

    if (newHighScoreElement) {
        if (highScoreResult.isNew) {
            const scoreDiff = highScoreResult.new - highScoreResult.old;
            newHighScoreElement.innerHTML = `🎉 NEW HIGH SCORE! 🎉<br><span style="font-size: 14px; color: #00cc66;">+${scoreDiff.toLocaleString()} points!</span>`;
            newHighScoreElement.style.color = '#ff6600'; // Orange for celebration
            newHighScoreElement.style.fontSize = '18px';
            newHighScoreElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
            
            // Add animation class for celebration
            newHighScoreElement.style.animation = 'pulse 0.5s ease-in-out infinite alternate';
            
            console.log('Showing NEW HIGH SCORE celebration!');
        } else {
            const scoreDiff = gameState.highScore - gameState.score;
            if (scoreDiff > 0) {
                newHighScoreElement.innerHTML = `<span style="font-size: 12px; color: #cc0000;">Need ${scoreDiff.toLocaleString()} more points to beat your high score!</span>`;
            } else {
                newHighScoreElement.innerHTML = '';
            }
            newHighScoreElement.style.color = '#535353';
            newHighScoreElement.style.fontSize = '14px';
            newHighScoreElement.style.textShadow = 'none';
            newHighScoreElement.style.animation = 'none';
            
            console.log('Showing previous high score (no new record)');
        }
    }
}

// Initialize and start game
setTimeout(() => {
    try {
        resizeCanvas();
        loadHighScore(); // Load high score from localStorage
        initGame();
        spawnAsteroids();
        gameLoop();
    } catch (error) {
        console.error('Game initialization failed:', error);
        // Fallback initialization
        setTimeout(() => {
            try {
                resizeCanvas();
                loadHighScore(); // Load high score from localStorage
                initGame();
                spawnAsteroids();
                gameLoop();
            } catch (fallbackError) {
                console.error('Fallback initialization also failed:', fallbackError);
            }
        }, 1000);
    }
}, 100); 