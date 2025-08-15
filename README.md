# Retro Asteroid Shooter

A fast, fullscreen, top‑down asteroid shooter built with HTML5 Canvas and vanilla JavaScript. Minimalist retro visuals, tight controls, smart spawning (no unfair bottom spawns), asteroid collisions, and auto performance tuning keep gameplay smooth.

## Features

- **Fullscreen canvas**: Scales to your window; UI is fixed and readable
- **Responsive controls**: Snappy ship movement and shooting
- **Asteroid variety**:
  - Colors: grey, black, whitish grey, white, and transparent (with black borders)
  - Procedural shapes with rotation
  - Break into smaller pieces (limited) on destruction
- **Fair spawning**: Asteroids only enter from the top/left/right edges, never from the bottom
- **Physics**:
  - Horizontal wrap; controlled vertical behavior (top bounce, bottom bounce and cleanup off‑screen)
  - Asteroid↔asteroid collisions with separation and elastic bounce
- **Projectiles**: Clean retro rectangles with outlines
- **Particles**: Simple explosion particles on impacts
- **Camera shake**: Subtle impact feedback
- **Auto performance mode**: Detects low FPS and reduces background rendering to stay smooth

## Controls

- **Move**: WASD or Arrow Keys
- **Shoot**: Space
- **Pause/Resume**: Esc

## How to Run

- Just open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari)
- No build tools or servers required

If your browser blocks local file canvas features, use a simple server:
```bash
# Python 3
python -m http.server 8080
# then open http://localhost:8080
```

## Gameplay Rules (current build)

- Asteroids spawn from the top, left, or right edges (never from the bottom)
- They bounce at the very top and just below the bottom edge, and are cleaned up once far below view
- Destroyed large asteroids can split into 2 smaller ones if there aren’t many on screen
- Asteroids collide with each other and bounce apart
- Score increases with asteroid size; levels advance every 1000 points and add pressure (within caps)

## Performance

The game actively stays smooth:
- Caps the total asteroids on screen
- Reduces background elements count
- Auto performance mode when FPS < 30:
  - Skips planets/nebulas
  - Draws fewer stars
  - Exits performance mode automatically when FPS recovers

## Tuning (easy settings to tweak in `game.js`)

- **Player speed**: search for `class Player` → `this.speed = 10;`
- **Spawn amount per wave**: in `spawnAsteroids()` change:
  - `const numAsteroids = 2 + gameState.level;`
- **Max asteroids on screen**: in update loop condition:
  - `if (asteroids.length < Math.min(3 + gameState.level, 12)) { ... }`
- **Split threshold and limit**: where smaller asteroids are spawned:
  - `if (asteroid.size > 30 && asteroids.length < 8) { ... }`
- **Asteroid collision bounce**: elasticity set around `0.8` in the asteroid↔asteroid collision block
- **Camera shake strength**: search for `addCameraShake(asteroid.size / 10)` or `addCameraShake(5)`

## File Structure

- `index.html` – Canvas, UI, and styles
- `game.js` – All gameplay logic, rendering, input, physics
- `README.md` – This guide

## Troubleshooting

- “Cannot access 'width' before initialization”
  - Ensure `let width = canvas.width; let height = canvas.height;` are declared before functions using them
- “Cannot access 'player' before initialization”
  - Make sure `resizeCanvas()` is called inside the delayed init block before `initGame()` and not earlier in a way that references `player` too soon
- Blank screen
  - Open DevTools (F12) → Console to check for errors
  - Try serving via a local server (see “How to Run”)

## Roadmap Ideas

- Power‑ups: shield, rapid fire, spread shot, bomb, homing missiles
- Dash/boost (Shift)
- Mini‑boss every few levels
- Combo multiplier and damage numbers
- Mini‑map and edge threat indicators
- Sound effects and background music

Enjoy, and tell me which features you want next—I’ll wire them in! 🚀 