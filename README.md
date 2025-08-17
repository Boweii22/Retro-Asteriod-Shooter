<img width="1920" height="1440" alt="295shots_so" src="https://github.com/user-attachments/assets/bc8e08cc-5e91-4afe-8c1d-42f53e0e2b5b" />

# Cosmic Asteroid Shooter - Optimized Version

A high-performance, space-themed asteroid shooting game built with HTML5 Canvas and JavaScript.

## 🚀 Performance Optimizations & Bug Fixes

### Critical Issues Fixed:
- **Memory Leaks**: Eliminated infinite array growth that caused crashes
- **Collision Detection**: Fixed O(n²) complexity and array modification during iteration
- **Object Creation**: Implemented object pooling to reduce garbage collection
- **Canvas Performance**: Optimized rendering and reduced context state pollution
- **Boundary Issues**: Fixed object spawning outside canvas bounds
- **Race Conditions**: Eliminated simultaneous array modifications

### Performance Improvements:
- **Object Pooling**: Reuses objects instead of creating new ones every frame
- **Efficient Math**: Replaced `Math.hypot()` with `Math.sqrt()` for better performance
- **Smart Rendering**: Performance mode automatically reduces visual effects when FPS drops
- **Memory Limits**: Capped maximum objects (asteroids: 15, particles: 200, projectiles: 50)
- **Optimized Collisions**: Uses squared distance calculations to avoid unnecessary square roots
- **Frame Rate Management**: Intelligent performance scaling based on device capabilities

### Code Quality Improvements:
- **Error Handling**: Added try-catch blocks and fallback initialization
- **Modular Design**: Separated UI updates and game logic for better maintainability
- **Consistent Naming**: Standardized variable and function naming conventions
- **Memory Management**: Proper cleanup and resource management
- **Mobile Responsiveness**: Added responsive design for different screen sizes

## 🎮 Game Features

### Core Gameplay:
- **Asteroid Destruction**: Shoot asteroids to earn points and advance levels
- **Power-ups**: Collect shield, dash, and spread-shot abilities
- **Explosion Power**: Special ability unlocked every 7000 points
- **Progressive Difficulty**: Asteroids increase with each level

### Controls:
- **WASD** or **Arrow Keys**: Move spaceship
- **SPACE**: Shoot projectiles
- **SHIFT**: Dash (when power-up active)
- **Q**: Trigger explosion power (when available)
- **ESC**: Pause/Resume game

### Power-ups:
- **Shield**: Absorbs damage from asteroid collisions
- **Dash**: Provides temporary speed boost and invincibility
- **Spread Shot**: Fires three projectiles simultaneously
- **Explosion Power**: Destroys all asteroids on screen

## 🛠️ Technical Specifications

### Performance Targets:
- **Target FPS**: 60 FPS
- **Performance Mode**: Automatically activates below 30 FPS
- **Memory Usage**: Optimized with object pooling and limits
- **Mobile Support**: Responsive design with touch-friendly controls

### Browser Compatibility:
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **Canvas Support**: Requires HTML5 Canvas support
- **JavaScript**: ES6+ features used

## 📱 Mobile Optimization

- Responsive UI scaling
- Touch-friendly controls
- Performance mode for lower-end devices
- Optimized rendering for mobile GPUs

## 🚀 Getting Started

1. **Download**: Clone or download the repository
2. **Open**: Open `index.html` in a modern web browser
3. **Play**: Use WASD/Arrow keys to move, SPACE to shoot
4. **Enjoy**: Experience smooth, crash-free gameplay!

## 🔧 Development

### File Structure:
- `index.html` - Main HTML file with optimized CSS
- `game.js` - Optimized game logic with object pooling
- `README.md` - This documentation

### Key Classes:
- `ObjectPool` - Manages object reuse for performance
- `Player` - Player spaceship with power-up system
- `Asteroid` - Destructible asteroids with physics
- `Projectile` - Player projectiles with collision detection
- `Particle` - Explosion effects and visual feedback

### Performance Monitoring:
- Automatic FPS detection
- Performance mode activation
- Console logging for debugging
- Memory usage optimization

## 🎯 Future Enhancements

- Sound effects and background music
- Additional power-up types
- Boss battles and special enemies
- High score persistence
- Multiplayer support
- Advanced particle effects

## 📊 Performance Metrics

### Before Optimization:
- **Memory Usage**: Unbounded growth leading to crashes
- **FPS**: Variable, often dropping below 30
- **Collision Detection**: O(n²) complexity
- **Object Creation**: New objects every frame

### After Optimization:
- **Memory Usage**: Stable, capped limits
- **FPS**: Consistent 60 FPS on modern devices
- **Collision Detection**: Optimized with early exits
- **Object Creation**: Reused from pools

## 🐛 Bug Fixes

- Fixed array modification during iteration crashes
- Eliminated memory leaks from infinite object creation
- Resolved boundary checking issues
- Fixed race conditions in collision detection
- Corrected canvas context state management
- Added proper error handling and fallbacks

## 📝 License

This project is open source and available under the MIT License.

---

**Enjoy the optimized, crash-free gaming experience!** 🎮✨ 
