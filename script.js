var canvas, ctx;
        var gameMode = 'menu'; // 'menu', 'feed', 'play'
        
        // Pet stats
        var petStats = {
            hunger: 50,
            happiness: 50,
            size: 25,
            lastFed: Date.now()
        };

        // Snake properties
        var numberOfSegments = 25;
        var segLength = 16;

        // Enhanced color palette for arcade look
        var snakeColors = {
            bodyPrimary: '#4CAF50',
            bodySecondary: '#66BB6A',
            bodyDark: '#388E3C',
            head: '#4CAF50',
            eye: '#FFFFFF',
            pupil: '#000000',
            tongue: '#E53935',
            belly: '#81C784'
        };

        var bodyThickness = 28;
        var headRadius = 32;

        // Arrays for segment positions
        var x = Array.apply(null, Array(numberOfSegments)).map(Number.prototype.valueOf, 0);
        var y = Array.apply(null, Array(numberOfSegments)).map(Number.prototype.valueOf, 0);
        var mousePos;

        // Animation variables
        var tongueExtended = false;
        var tongueTimer = 0;
        var blinkTimer = 0;
        var isBlinking = false;

        // Feed mode variables
        var currentFood = null;
        var foodTypes = ['apple', 'mouse', 'bug'];
        var foodSpawnTimer = 0;
        var foodColors = {
            apple: '#FF4444',
            mouse: '#8B4513',
            bug: '#4B0082'
        };

        // Play mode instance
        var snakeRaceGame = null;

        function init() {
            canvas = document.getElementById("gameCanvas");
            ctx = canvas.getContext('2d');
            
            // Disable image smoothing for pixelated effect
            ctx.imageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.mozImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            document.addEventListener('mousemove', function(evt) {
                if (gameMode !== 'menu') {
                    mousePos = getMousePos(canvas, evt);
                }
            }, false);

            document.addEventListener('keydown', function(e) {
                if (gameMode === 'play' && snakeRaceGame) {
                    snakeRaceGame.handleKeyDown(e);
                }
            });

            document.addEventListener('keyup', function(e) {
                if (gameMode === 'play' && snakeRaceGame) {
                    snakeRaceGame.handleKeyUp(e);
                }
            });

            // Initialize snake position
            x[0] = canvas.width / 2;
            y[0] = canvas.height / 2;
            for (var i = 1; i < numberOfSegments; i++) {
                x[i] = x[0] - i * segLength;
                y[i] = y[0];
            }
            mousePos = { x: x[0], y: y[0] };

            // Load saved stats
            loadPetStats();

            requestAnimationFrame(animate);
        }

        function getMousePos(canvas, evt) {
            var rect = canvas.getBoundingClientRect();
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        }

        function animate() {
            // Clear canvas with dark background
            ctx.fillStyle = "#1a1a1a";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (gameMode === 'feed' && mousePos !== undefined) {
                // Update timers
                tongueTimer += 1;
                blinkTimer += 1;
                foodSpawnTimer += 1;
                
                // Tongue animation (extends every 180 frames)
                if (tongueTimer > 180) {
                    tongueExtended = true;
                    if (tongueTimer > 200) {
                        tongueExtended = false;
                        tongueTimer = 0;
                    }
                }
                
                // Blink animation (blinks every 240 frames)
                if (blinkTimer > 240) {
                    isBlinking = true;
                    if (blinkTimer > 250) {
                        isBlinking = false;
                        blinkTimer = 0;
                    }
                }

                // Update snake positions
                dragSegment(0, mousePos.x, mousePos.y);
                for (var i = 0; i < numberOfSegments - 1; i++) {
                    dragSegment(i + 1, x[i], y[i]);
                }

                // Spawn food if none exists and timer is ready
                if (!currentFood && foodSpawnTimer > 120) { // 2 seconds at 60fps
                    spawnFood();
                    foodSpawnTimer = 0;
                }

                // Draw food if it exists
                if (currentFood) {
                    drawFood();
                    checkFoodCollision();
                }

                // Draw snake body segments with pixelated style
                drawPixelatedBody();
                
                // Draw head last (on top)
                drawArcadeHead(x[0], y[0], x[1], y[1]);

                // Update stats display
                updateStatsDisplay();
            } else if (gameMode === 'play' && snakeRaceGame) {
                snakeRaceGame.update();
                snakeRaceGame.draw();
            }

            requestAnimationFrame(animate);
        }

        function spawnFood() {
            var foodType = foodTypes[Math.floor(Math.random() * foodTypes.length)];
            var padding = 50;
            currentFood = {
                type: foodType,
                x: Math.random() * (canvas.width - 2 * padding) + padding,
                y: Math.random() * (canvas.height - 2 * padding) + padding,
                size: 20,
                pulseTimer: 0
            };
        }

        function drawFood() {
            if (!currentFood) return;
            
            currentFood.pulseTimer += 0.1;
            var pulse = Math.sin(currentFood.pulseTimer) * 0.1 + 1;
            var foodSize = currentFood.size * pulse;
            
            ctx.save();
            ctx.translate(currentFood.x, currentFood.y);
            
            // Draw food based on type
            switch(currentFood.type) {
                case 'apple':
                    drawApple(foodSize);
                    break;
                case 'mouse':
                    drawMouse(foodSize);
                    break;
                case 'bug':
                    drawBug(foodSize);
                    break;
            }
            
            ctx.restore();
        }

        function drawApple(size) {
            // Apple body
            ctx.fillStyle = foodColors.apple;
            ctx.beginPath();
            ctx.arc(0, 2, size/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Apple highlight
            ctx.fillStyle = '#FF8888';
            ctx.beginPath();
            ctx.arc(-size/4, -size/4, size/6, 0, Math.PI * 2);
            ctx.fill();
            
            // Apple stem
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-2, -size/2 - 2, 4, 6);
        }

        function drawMouse(size) {
            // Mouse body
            ctx.fillStyle = foodColors.mouse;
            ctx.beginPath();
            ctx.ellipse(0, 0, size/2, size/3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Mouse tail
            ctx.strokeStyle = foodColors.mouse;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(size/2, 0);
            ctx.quadraticCurveTo(size, -size/2, size/2, -size);
            ctx.stroke();
            
            // Mouse ears
            ctx.fillStyle = foodColors.mouse;
            ctx.beginPath();
            ctx.arc(-size/3, -size/4, size/6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(-size/6, -size/3, size/6, 0, Math.PI * 2);
            ctx.fill();
        }

        function drawBug(size) {
            // Bug body
            ctx.fillStyle = foodColors.bug;
            ctx.beginPath();
            ctx.ellipse(0, 0, size/3, size/2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Bug wings
            ctx.fillStyle = '#6A0DAD';
            ctx.beginPath();
            ctx.ellipse(-size/4, -size/4, size/6, size/4, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(size/4, -size/4, size/6, size/4, 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            // Bug antennae
            ctx.strokeStyle = foodColors.bug;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-size/6, -size/2);
            ctx.lineTo(-size/3, -size);
            ctx.moveTo(size/6, -size/2);
            ctx.lineTo(size/3, -size);
            ctx.stroke();
        }

        function checkFoodCollision() {
            if (!currentFood) return;
            
            var dx = x[0] - currentFood.x;
            var dy = y[0] - currentFood.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 30) { // Collision threshold
                eatFood();
            }
        }

        function eatFood() {
            if (!currentFood) return;
            
            // Play eating sound effect (simplified)
            playEatingSound();
            
            // Update stats based on food type
            switch(currentFood.type) {
                case 'apple':
                    petStats.hunger = Math.min(100, petStats.hunger + 15);
                    petStats.happiness = Math.min(100, petStats.happiness + 5);
                    break;
                case 'mouse':
                    petStats.hunger = Math.min(100, petStats.hunger + 25);
                    petStats.happiness = Math.min(100, petStats.happiness + 10);
                    break;
                case 'bug':
                    petStats.hunger = Math.min(100, petStats.hunger + 10);
                    petStats.happiness = Math.min(100, petStats.happiness + 3);
                    break;
            }
            
            // Increase size slightly
            if (petStats.hunger > 80) {
                petStats.size = Math.min(50, petStats.size + 1);
                if (petStats.size > numberOfSegments) {
                    numberOfSegments = petStats.size;
                    // Add new segments
                    for (var i = x.length; i < numberOfSegments; i++) {
                        x.push(x[x.length - 1] - segLength);
                        y.push(y[y.length - 1]);
                    }
                }
            }
            
            petStats.lastFed = Date.now();
            savePetStats();
            
            // Remove food
            currentFood = null;
            foodSpawnTimer = 0; // Reset spawn timer for 2-second delay
        }

        function playEatingSound() {
            // Create a simple eating sound using Web Audio API
            try {
                var audioContext = new (window.AudioContext || window.webkitAudioContext)();
                var oscillator = audioContext.createOscillator();
                var gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } catch(e) {
                console.log("Audio not supported");
            }
        }

        function updateStatsDisplay() {
            document.getElementById('hunger').textContent = Math.floor(petStats.hunger);
            document.getElementById('happiness').textContent = Math.floor(petStats.happiness);
            document.getElementById('size').textContent = petStats.size;
        }

        function drawPixelatedBody() {
            for (var i = 1; i < numberOfSegments - 1; i++) {
                var segmentSize = bodyThickness - (i * 0.3);
                
                ctx.save();
                ctx.translate(x[i], y[i]);
                
                // Main body segment
                ctx.fillStyle = snakeColors.bodyPrimary;
                ctx.beginPath();
                ctx.arc(0, 0, segmentSize/2, 0, Math.PI * 2);
                ctx.fill();
                
                // Add highlight
                ctx.fillStyle = snakeColors.bodySecondary;
                ctx.beginPath();
                ctx.arc(-segmentSize/4, -segmentSize/4, segmentSize/6, 0, Math.PI * 2);
                ctx.fill();
                
                // Add shadow
                ctx.fillStyle = snakeColors.bodyDark;
                ctx.beginPath();
                ctx.arc(segmentSize/4, segmentSize/4, segmentSize/8, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
            
            drawPixelatedTail();
        }

        function drawPixelatedTail() {
            var tailIndex = numberOfSegments - 1;
            var tailSize = bodyThickness * 0.5;
            
            ctx.save();
            ctx.translate(x[tailIndex], y[tailIndex]);
            
            var dx = x[tailIndex] - x[tailIndex - 1];
            var dy = y[tailIndex] - y[tailIndex - 1];
            var angle = Math.atan2(dy, dx);
            ctx.rotate(angle);
            
            ctx.fillStyle = snakeColors.bodyPrimary;
            ctx.beginPath();
            ctx.arc(0, 0, tailSize/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = snakeColors.bodySecondary;
            ctx.beginPath();
            ctx.arc(tailSize/3, 0, tailSize/4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }

        function drawArcadeHead(headX, headY, nextSegX, nextSegY) {
            var dx = headX - nextSegX;
            var dy = headY - nextSegY;
            var angle = Math.atan2(dy, dx);

            ctx.save();
            ctx.translate(headX, headY);
            ctx.rotate(angle);

            var headWidth = 26;
            var headHeight = 20;
            
            // Draw oval head
            ctx.fillStyle = snakeColors.head;
            ctx.beginPath();
            ctx.ellipse(0, 0, headWidth, headHeight, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Add head highlight
            ctx.fillStyle = snakeColors.bodySecondary;
            ctx.beginPath();
            ctx.ellipse(-headWidth/3, -headHeight/3, headWidth/5, headHeight/5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            var eyeRadius = 6;
            var eyeOffsetX = headWidth * 0.4;
            var eyeOffsetY = -headHeight * 0.2;
            
            if (!isBlinking) {
                ctx.fillStyle = snakeColors.eye;
                ctx.beginPath();
                ctx.arc(eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = snakeColors.pupil;
                ctx.beginPath();
                ctx.arc(eyeOffsetX + 1.5, eyeOffsetY, eyeRadius * 0.4, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(eyeOffsetX + 0.5, eyeOffsetY - 1.5, eyeRadius * 0.2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.strokeStyle = snakeColors.pupil;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(eyeOffsetX, eyeOffsetY, eyeRadius * 0.8, 0.2, Math.PI - 0.2);
                ctx.stroke();
            }

            // Tongue
            if (tongueExtended) {
                var tongueLength = 10;
                var tongueY = headHeight * 0.6;
                
                ctx.strokeStyle = snakeColors.tongue;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(headWidth * 0.9, tongueY);
                ctx.lineTo(headWidth * 0.9 + tongueLength, tongueY);
                ctx.moveTo(headWidth * 0.9 + tongueLength - 3, tongueY - 2);
                ctx.lineTo(headWidth * 0.9 + tongueLength, tongueY);
                ctx.lineTo(headWidth * 0.9 + tongueLength - 3, tongueY + 2);
                ctx.stroke();
            }

            // Smile
            ctx.strokeStyle = snakeColors.pupil;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(headWidth * 0.2, headHeight * 0.4, headWidth * 0.3, 0.2, Math.PI - 0.2);
            ctx.stroke();

            ctx.restore();
        }

        function dragSegment(i, xin, yin) {
            var dx = xin - x[i];
            var dy = yin - y[i];
            var angle = Math.atan2(dy, dx);
            x[i] = xin - Math.cos(angle) * segLength;
            y[i] = yin - Math.sin(angle) * segLength;
        }

        // Rectangle collision helper
        function rectIntersect(a, b) {
            return a.x < b.x + b.width &&
                   a.x + a.width > b.x &&
                   a.y < b.y + b.height &&
                   a.y + a.height > b.y;
        }

        // Snake Race mini game
        class SnakeRaceGame {
            constructor(ctx, canvas) {
                this.ctx = ctx;
                this.canvas = canvas;
                this.reset();
            }

            reset() {
                this.groundY = this.canvas.height - 80;
                this.snake = { x: 100, y: this.groundY - 30, width: 60, height: 30, vy: 0, isJumping: false, isDucking: false };
                this.gravity = 0.8;
                this.obstacles = [];
                this.fruits = [];
                this.spawnTimer = 0;
                this.fruitTimer = 0;
                this.score = 0;
                this.energy = 100;
                this.startTime = Date.now();
                this.gameOver = false;
                this.ended = false;
            }

            handleKeyDown(e) {
                if (e.key === 'ArrowUp' && !this.snake.isJumping) {
                    this.snake.isJumping = true;
                    this.snake.vy = -15;
                }
                if (e.key === 'ArrowDown' && !this.snake.isJumping) {
                    this.snake.isDucking = true;
                }
            }

            handleKeyUp(e) {
                if (e.key === 'ArrowDown') {
                    this.snake.isDucking = false;
                }
            }

            spawnObstacle() {
                var type = Math.random() < 0.5 ? 'ground' : 'high';
                if (type === 'ground') {
                    this.obstacles.push({ x: this.canvas.width + 20, y: this.groundY - 30, width: 30, height: 30 });
                } else {
                    this.obstacles.push({ x: this.canvas.width + 20, y: this.groundY - 80, width: 40, height: 30 });
                }
            }

            spawnFruit() {
                this.fruits.push({ x: this.canvas.width + 20, y: this.groundY - 40, size: 20 });
            }

            update() {
                if (this.gameOver) return;

                var elapsed = (Date.now() - this.startTime) / 1000;
                if (elapsed >= 90) {
                    this.gameOver = true;
                    this.endGame();
                }

                if (this.snake.isJumping) {
                    this.snake.y += this.snake.vy;
                    this.snake.vy += this.gravity;
                    if (this.snake.y >= this.groundY - this.snake.height) {
                        this.snake.y = this.groundY - this.snake.height;
                        this.snake.vy = 0;
                        this.snake.isJumping = false;
                    }
                } else if (this.snake.isDucking) {
                    this.snake.height = 15;
                } else {
                    this.snake.height = 30;
                }

                this.spawnTimer++;
                this.fruitTimer++;
                if (this.spawnTimer > 90) {
                    this.spawnObstacle();
                    this.spawnTimer = 0;
                }
                if (this.fruitTimer > 150) {
                    this.spawnFruit();
                    this.fruitTimer = 0;
                }

                this.obstacles.forEach(o => o.x -= 6);
                this.fruits.forEach(f => f.x -= 6);
                this.obstacles = this.obstacles.filter(o => o.x + o.width > 0);
                this.fruits = this.fruits.filter(f => f.x + f.size > 0);

                var snakeRect = { x: this.snake.x, y: this.snake.y, width: this.snake.width, height: this.snake.height };

                for (var i = 0; i < this.obstacles.length; i++) {
                    var o = this.obstacles[i];
                    if (rectIntersect(snakeRect, o)) {
                        this.obstacles.splice(i, 1);
                        this.energy -= 20;
                        break;
                    }
                }

                for (var j = 0; j < this.fruits.length; j++) {
                    var f = this.fruits[j];
                    var fr = { x: f.x, y: f.y, width: f.size, height: f.size };
                    if (rectIntersect(snakeRect, fr)) {
                        this.fruits.splice(j, 1);
                        this.score += 10;
                        this.energy = Math.min(100, this.energy + 10);
                        j--;
                    }
                }

                this.score += 0.1;

                if (this.energy <= 0) {
                    this.energy = 0;
                    this.gameOver = true;
                    this.endGame();
                }
            }

            drawSnake() {
                var s = this.snake;
                this.ctx.save();
                this.ctx.translate(s.x, s.y);
                this.ctx.fillStyle = snakeColors.bodyPrimary;
                this.ctx.fillRect(0, 0, s.width, s.height);
                this.ctx.fillStyle = snakeColors.head;
                this.ctx.beginPath();
                this.ctx.arc(s.width, s.height / 2, s.height / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }

            draw() {
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(0, this.groundY, this.canvas.width, 5);

                this.ctx.fillStyle = '#8B4513';
                this.obstacles.forEach(o => {
                    this.ctx.fillRect(o.x, o.y, o.width, o.height);
                });

                this.ctx.fillStyle = '#FFD700';
                this.fruits.forEach(f => {
                    this.ctx.beginPath();
                    this.ctx.arc(f.x + f.size / 2, f.y + f.size / 2, f.size / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                });

                this.drawSnake();

                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '20px Arial';
                this.ctx.fillText('Energía: ' + Math.floor(this.energy), 20, 30);
                this.ctx.fillText('Puntuación: ' + Math.floor(this.score), 20, 60);
            }

            endGame() {
                if (this.ended) return;
                this.ended = true;
                var state;
                if (this.energy > 50 && this.score >= 50) {
                    state = 'contenta';
                } else if (this.energy <= 0) {
                    state = 'cansada';
                } else {
                    state = 'hambrienta';
                }
                showPlayResults(Math.floor(this.score), state);
            }
        }

        function showPlayResults(score, state) {
            var overlay = document.getElementById('playOverlay');
            if (!overlay) return;
            document.getElementById('playScore').textContent = 'Puntuación: ' + score;
            document.getElementById('playState').textContent = 'Estado: ' + state;
            overlay.classList.remove('hidden');
        }

        // Game mode functions
        function startFeedMode() {
            gameMode = 'feed';
            document.getElementById('mainMenu').classList.add('hidden');
            document.getElementById('feedMode').classList.remove('hidden');
            
            // Initialize mouse position
            mousePos = { x: canvas.width / 2, y: canvas.height / 2 };
            
            // Spawn first food
            setTimeout(spawnFood, 1000);
        }

        function startPlayMode() {
            gameMode = 'play';
            document.getElementById('mainMenu').classList.add('hidden');
            var overlay = document.getElementById('playOverlay');
            if (overlay) overlay.classList.add('hidden');
            if (!snakeRaceGame) {
                snakeRaceGame = new SnakeRaceGame(ctx, canvas);
            } else {
                snakeRaceGame.reset();
            }
        }

        function backToMenu() {
            gameMode = 'menu';
            document.getElementById('feedMode').classList.add('hidden');
            document.getElementById('mainMenu').classList.remove('hidden');
            var overlay = document.getElementById('playOverlay');
            if (overlay) overlay.classList.add('hidden');

            // Reset food
            currentFood = null;
            foodSpawnTimer = 0;

            if (snakeRaceGame) {
                snakeRaceGame.gameOver = true;
            }
        }

        // Save/Load functions
        function savePetStats() {
            try {
                var statsData = JSON.stringify(petStats);
                // Note: localStorage not available in Claude artifacts
                // In a real implementation, you would use localStorage.setItem('snakePetStats', statsData);
                console.log('Stats saved:', statsData);
            } catch(e) {
                console.log('Save not supported in this environment');
            }
        }

        function loadPetStats() {
            try {
                // Note: localStorage not available in Claude artifacts
                // In a real implementation: var saved = localStorage.getItem('snakePetStats');
                console.log('Stats loaded (demo data)');
            } catch(e) {
                console.log('Load not supported in this environment');
            }
        }

        window.addEventListener('load', init);
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });


//-------------------------------------CUSTOMIZE MODULE --------------------------------------------------------//

// Customize Module JavaScript

// Customize Module JavaScript

// Snake customization data
var snakeData = {
    color: {
        primary: '#4CAF50',
        secondary: '#66BB6A', 
        dark: '#388E3C',
        name: 'default'
    },
    pattern: 'solid',
    accessory: 'none',
    unlocked: {
        colors: ['default', 'blue', 'red', 'purple', 'gold', 'rainbow'],
        patterns: ['solid', 'striped', 'spotted', 'gradient'],
        accessories: ['none', 'hat', 'glasses', 'crown', 'sunglasses', 'bow']
    }
};

// Preview canvas variables
var previewCanvas, previewCtx;
var previewSnakeX = [];
var previewSnakeY = [];
var previewAnimation = 0;

// Color definitions
var colorPalettes = {
    default: { primary: '#4CAF50', secondary: '#66BB6A', dark: '#388E3C' },
    blue: { primary: '#2196F3', secondary: '#64B5F6', dark: '#1976D2' },
    red: { primary: '#F44336', secondary: '#EF5350', dark: '#C62828' },
    purple: { primary: '#9C27B0', secondary: '#BA68C8', dark: '#7B1FA2' },
    gold: { primary: '#FFD700', secondary: '#FFE55C', dark: '#FFC107' },
    rainbow: { primary: '#FF6B6B', secondary: '#4ECDC4', dark: '#45B7AA' }
};

// Initialize customization system
function initCustomization() {
    previewCanvas = document.getElementById('previewCanvas');
    if (!previewCanvas) return;
    
    previewCtx = previewCanvas.getContext('2d');
    
    // Disable smoothing for pixelated look
    previewCtx.imageSmoothingEnabled = false;
    previewCtx.webkitImageSmoothingEnabled = false;
    previewCtx.mozImageSmoothingEnabled = false;
    previewCtx.msImageSmoothingEnabled = false;

    // Initialize preview snake positions
    initPreviewSnake();
    
    // Load saved customization
    loadSnakeCustomization();
    
    // Setup event listeners
    setupCustomizationEvents();
    
    // Start preview animation
    animatePreview();
    
    // Update unlock status
    updateUnlockStatus();
}

function initPreviewSnake() {
    var segments = 8;
    var centerX = previewCanvas.width / 2;
    var centerY = previewCanvas.height / 2;
    
    previewSnakeX = [];
    previewSnakeY = [];
    
    for (var i = 0; i < segments; i++) {
        previewSnakeX.push(centerX - i * 20);
        previewSnakeY.push(centerY);
    }
}

function setupCustomizationEvents() {
    // Color swatches
    var colorSwatches = document.querySelectorAll('.color-swatch');
    colorSwatches.forEach(function(swatch) {
        swatch.addEventListener('click', function() {
            if (this.classList.contains('locked')) {
                showLockedMessage();
                return;
            }
            
            selectColor(this);
        });
    });
    
    // Pattern buttons
    var patternBtns = document.querySelectorAll('.pattern-btn');
    patternBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (this.classList.contains('locked')) {
                showLockedMessage();
                return;
            }
            
            selectPattern(this);
        });
    });
    
    // Accessory buttons
    var accessoryBtns = document.querySelectorAll('.accessory-btn');
    accessoryBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (this.classList.contains('locked')) {
                showLockedMessage();
                return;
            }
            
            selectAccessory(this);
        });
    });
}

function selectColor(colorElement) {
    // Remove active class from all color swatches
    document.querySelectorAll('.color-swatch').forEach(function(swatch) {
        swatch.classList.remove('active');
    });
    
    // Add active class to selected swatch
    colorElement.classList.add('active');
    
    // Update snake data
    var colorName = colorElement.dataset.color;
    snakeData.color.name = colorName;
    snakeData.color.primary = colorElement.dataset.primary;
    snakeData.color.secondary = colorElement.dataset.secondary;
    snakeData.color.dark = colorElement.dataset.dark;
    
    // Save and update preview
    saveSnakeCustomization();
    updateStyleDisplay();
}

function selectPattern(patternElement) {
    // Remove active class from all pattern buttons
    document.querySelectorAll('.pattern-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    // Add active class to selected pattern
    patternElement.classList.add('active');
    
    // Update snake data
    snakeData.pattern = patternElement.dataset.pattern;
    
    // Save and update preview
    saveSnakeCustomization();
    updateStyleDisplay();
}

function selectAccessory(accessoryElement) {
    // Remove active class from all accessory buttons
    document.querySelectorAll('.accessory-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    // Add active class to selected accessory
    accessoryElement.classList.add('active');
    
    // Update snake data
    snakeData.accessory = accessoryElement.dataset.accessory;
    
    // Save and update preview
    saveSnakeCustomization();
    updateStyleDisplay();
}

function updateStyleDisplay() {
    var styleText = capitalizeFirst(snakeData.color.name) + ' ' + 
                   capitalizeFirst(snakeData.pattern);
    
    if (snakeData.accessory !== 'none') {
        styleText += ' with ' + capitalizeFirst(snakeData.accessory);
    }
    
    var currentStyleElement = document.getElementById('currentStyle');
    if (currentStyleElement) {
        currentStyleElement.textContent = styleText;
    }
}

function animatePreview() {
    if (!previewCanvas || !previewCtx) return;
    
    previewAnimation += 0.02;
    
    // Clear canvas
    previewCtx.fillStyle = '#1a1a1a';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    // Update snake positions for gentle wave motion
    var centerX = previewCanvas.width / 2;
    var centerY = previewCanvas.height / 2;
    
    for (var i = 0; i < previewSnakeX.length; i++) {
        var waveOffset = Math.sin(previewAnimation + i * 0.3) * 15;
        previewSnakeX[i] = centerX - i * 18 + waveOffset;
        previewSnakeY[i] = centerY + Math.sin(previewAnimation * 0.5 + i * 0.2) * 8;
    }
    
    // Draw preview snake
    drawPreviewSnake();
    
    requestAnimationFrame(animatePreview);
}

function drawPreviewSnake() {
    // Draw body segments
    for (var i = 1; i < previewSnakeX.length; i++) {
        var segmentSize = 20 - (i * 0.5);
        drawPreviewSegment(previewSnakeX[i], previewSnakeY[i], segmentSize, i);
    }
    
    // Draw head
    drawPreviewHead(previewSnakeX[0], previewSnakeY[0]);
}

function drawPreviewSegment(x, y, size, index) {
    previewCtx.save();
    previewCtx.translate(x, y);
    
    var colors = getCurrentColors();
    
    // Apply pattern
    switch(snakeData.pattern) {
        case 'solid':
            drawSolidSegment(size, colors);
            break;
        case 'striped':
            drawStripedSegment(size, colors, index);
            break;
        case 'spotted':
            drawSpottedSegment(size, colors);
            break;
        case 'gradient':
            drawGradientSegment(size, colors);
            break;
        default:
            drawSolidSegment(size, colors);
    }
    
    previewCtx.restore();
}

function drawSolidSegment(size, colors) {
    // Main body
    previewCtx.fillStyle = colors.primary;
    previewCtx.beginPath();
    previewCtx.arc(0, 0, size/2, 0, Math.PI * 2);
    previewCtx.fill();
    
    // Highlight
    previewCtx.fillStyle = colors.secondary;
    previewCtx.beginPath();
    previewCtx.arc(-size/4, -size/4, size/6, 0, Math.PI * 2);
    previewCtx.fill();
}

function drawStripedSegment(size, colors, index) {
    // Alternating stripes
    var color = (index % 2 === 0) ? colors.primary : colors.secondary;
    previewCtx.fillStyle = color;
    previewCtx.beginPath();
    previewCtx.arc(0, 0, size/2, 0, Math.PI * 2);
    previewCtx.fill();
    
    // Add stripe lines
    previewCtx.strokeStyle = colors.dark;
    previewCtx.lineWidth = 1;
    previewCtx.beginPath();
    previewCtx.moveTo(-size/2, 0);
    previewCtx.lineTo(size/2, 0);
    previewCtx.stroke();
}

function drawSpottedSegment(size, colors) {
    // Main body
    previewCtx.fillStyle = colors.primary;
    previewCtx.beginPath();
    previewCtx.arc(0, 0, size/2, 0, Math.PI * 2);
    previewCtx.fill();
    
    // Spots
    previewCtx.fillStyle = colors.dark;
    previewCtx.beginPath();
    previewCtx.arc(size/4, -size/4, size/8, 0, Math.PI * 2);
    previewCtx.fill();
    previewCtx.beginPath();
    previewCtx.arc(-size/3, size/3, size/10, 0, Math.PI * 2);
    previewCtx.fill();
}

function drawGradientSegment(size, colors) {
    var gradient = previewCtx.createRadialGradient(0, 0, 0, 0, 0, size/2);
    gradient.addColorStop(0, colors.secondary);
    gradient.addColorStop(1, colors.primary);
    
    previewCtx.fillStyle = gradient;
    previewCtx.beginPath();
    previewCtx.arc(0, 0, size/2, 0, Math.PI * 2);
    previewCtx.fill();
}

function drawPreviewHead(x, y) {
    previewCtx.save();
    previewCtx.translate(x, y);
    
    var colors = getCurrentColors();
    var headWidth = 22;
    var headHeight = 16;
    
    // Main head
    previewCtx.fillStyle = colors.primary;
    previewCtx.beginPath();
    previewCtx.ellipse(0, 0, headWidth, headHeight, 0, 0, Math.PI * 2);
    previewCtx.fill();
    
    // Head highlight
    previewCtx.fillStyle = colors.secondary;
    previewCtx.beginPath();
    previewCtx.ellipse(-headWidth/3, -headHeight/3, headWidth/5, headHeight/5, 0, 0, Math.PI * 2);
    previewCtx.fill();
    
    // Eyes
    previewCtx.fillStyle = '#FFFFFF';
    previewCtx.beginPath();
    previewCtx.arc(headWidth * 0.3, -headHeight * 0.2, 4, 0, Math.PI * 2);
    previewCtx.fill();
    
    // Pupil
    previewCtx.fillStyle = '#000000';
    previewCtx.beginPath();
    previewCtx.arc(headWidth * 0.3 + 1, -headHeight * 0.2, 1.5, 0, Math.PI * 2);
    previewCtx.fill();
    
    // Draw accessory
    drawAccessory();
    
    previewCtx.restore();
}

function drawAccessory() {
    var headWidth = 22;
    var headHeight = 16;
    
    switch(snakeData.accessory) {
        case 'hat':
            // Top hat
            previewCtx.fillStyle = '#1a1a1a';
            previewCtx.fillRect(-8, -headHeight - 12, 16, 12);
            previewCtx.fillRect(-10, -headHeight - 2, 20, 4);
            break;
            
        case 'glasses':
            // Glasses frame
            previewCtx.strokeStyle = '#1a1a1a';
            previewCtx.lineWidth = 2;
            previewCtx.beginPath();
            previewCtx.arc(headWidth * 0.3, -headHeight * 0.2, 6, 0, Math.PI * 2);
            previewCtx.moveTo(headWidth * 0.3 + 6, -headHeight * 0.2);
            previewCtx.lineTo(headWidth * 0.3 + 10, -headHeight * 0.2);
            previewCtx.stroke();
            break;
            
        case 'crown':
            // Crown
            previewCtx.fillStyle = '#FFD700';
            previewCtx.beginPath();
            previewCtx.moveTo(-12, -headHeight);
            previewCtx.lineTo(-8, -headHeight - 8);
            previewCtx.lineTo(-4, -headHeight - 4);
            previewCtx.lineTo(0, -headHeight - 10);
            previewCtx.lineTo(4, -headHeight - 4);
            previewCtx.lineTo(8, -headHeight - 8);
            previewCtx.lineTo(12, -headHeight);
            previewCtx.closePath();
            previewCtx.fill();
            
            // Crown gems
            previewCtx.fillStyle = '#FF0000';
            previewCtx.beginPath();
            previewCtx.arc(0, -headHeight - 6, 2, 0, Math.PI * 2);
            previewCtx.fill();
            break;
            
        case 'sunglasses':
            // Sunglasses lenses
            previewCtx.fillStyle = '#1a1a1a';
            previewCtx.beginPath();
            previewCtx.arc(headWidth * 0.3, -headHeight * 0.2, 5, 0, Math.PI * 2);
            previewCtx.fill();
            
            // Frame
            previewCtx.strokeStyle = '#333';
            previewCtx.lineWidth = 2;
            previewCtx.beginPath();
            previewCtx.arc(headWidth * 0.3, -headHeight * 0.2, 6, 0, Math.PI * 2);
            previewCtx.stroke();
            break;
            
        case 'bow':
            // Bow tie
            previewCtx.fillStyle = '#FF1493';
            previewCtx.beginPath();
            previewCtx.moveTo(-6, headHeight * 0.6);
            previewCtx.lineTo(-2, headHeight * 0.3);
            previewCtx.lineTo(2, headHeight * 0.3);
            previewCtx.lineTo(6, headHeight * 0.6);
            previewCtx.lineTo(2, headHeight * 0.9);
            previewCtx.lineTo(-2, headHeight * 0.9);
            previewCtx.closePath();
            previewCtx.fill();
            
            // Bow center
            previewCtx.fillStyle = '#DC143C';
            previewCtx.fillRect(-2, headHeight * 0.5, 4, 6);
            break;
    }
}

function getCurrentColors() {
    if (snakeData.color.name === 'rainbow') {
        // Rainbow effect - cycle through colors
        var hue = (previewAnimation * 50) % 360;
        return {
            primary: 'hsl(' + hue + ', 70%, 60%)',
            secondary: 'hsl(' + ((hue + 60) % 360) + ', 70%, 70%)',
            dark: 'hsl(' + ((hue + 30) % 360) + ', 70%, 40%)'
        };
    }
    
    return snakeData.color;
}

function updateUnlockStatus() {
    // Check what should be unlocked based on pet stats
    checkUnlocks();
    
    // Update UI to reflect unlocked items
    updateUnlockUI();
}

function checkUnlocks() {
    // Get current pet stats (would come from main game)
    var stats = getPetStats(); // This function should be available from main game
    
    // Check color unlocks
    if (stats.feedCount >= 50 && !snakeData.unlocked.colors.includes('gold')) {
        snakeData.unlocked.colors.push('gold');
        showUnlockNotification('Golden Color unlocked!');
    }
    
    if (stats.happiness >= 100 && !snakeData.unlocked.colors.includes('rainbow')) {
        snakeData.unlocked.colors.push('rainbow');
        showUnlockNotification('Rainbow Color unlocked!');
    }
    
    // Check pattern unlocks
    if (stats.size >= 40 && !snakeData.unlocked.patterns.includes('gradient')) {
        snakeData.unlocked.patterns.push('gradient');
        showUnlockNotification('Gradient Pattern unlocked!');
    }
    
    // Check accessory unlocks
    if (stats.playHighScore >= 1000 && !snakeData.unlocked.accessories.includes('sunglasses')) {
        snakeData.unlocked.accessories.push('sunglasses');
        showUnlockNotification('Sunglasses unlocked!');
    }
    
    if (stats.happyDays >= 7 && !snakeData.unlocked.accessories.includes('bow')) {
        snakeData.unlocked.accessories.push('bow');
        showUnlockNotification('Bow Tie unlocked!');
    }
}

function updateUnlockUI() {
    // Update color swatches
    document.querySelectorAll('.color-swatch').forEach(function(swatch) {
        var colorName = swatch.dataset.color;
        if (snakeData.unlocked.colors.includes(colorName)) {
            swatch.classList.remove('locked');
        } else {
            swatch.classList.add('locked');
        }
    });
    
    // Update pattern buttons
    document.querySelectorAll('.pattern-btn').forEach(function(btn) {
        var patternName = btn.dataset.pattern;
        if (snakeData.unlocked.patterns.includes(patternName)) {
            btn.classList.remove('locked');
        } else {
            btn.classList.add('locked');
        }
    });
    
    // Update accessory buttons
    document.querySelectorAll('.accessory-btn').forEach(function(btn) {
        var accessoryName = btn.dataset.accessory;
        if (snakeData.unlocked.accessories.includes(accessoryName)) {
            btn.classList.remove('locked');
        } else {
            btn.classList.add('locked');
        }
    });
}

function showLockedMessage() {
    // Create temporary notification
    var notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(229, 57, 53, 0.9);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-family: 'Courier New', monospace;
        font-size: 16px;
        z-index: 1000;
        box-shadow: 0 0 20px rgba(229, 57, 53, 0.5);
    `;
    notification.textContent = '🔒 Item locked! Check unlock requirements below.';
    
    document.body.appendChild(notification);
    
    // Remove after 2 seconds
    setTimeout(function() {
        document.body.removeChild(notification);
    }, 2000);
}

function showUnlockNotification(message) {
    var notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(76, 175, 80, 0.9);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-family: 'Courier New', monospace;
        font-size: 16px;
        z-index: 1000;
        box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = '🎉 ' + message;
    
    // Add CSS animation
    var style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(function() {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(function() {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        }, 300);
    }, 3000);
}

function saveSnakeCustomization() {
    // In a real application, this would save to localStorage
    try {
        // localStorage.setItem('snakeCustomization', JSON.stringify(snakeData));
        console.log('Snake customization saved:', snakeData);
    } catch(e) {
        console.log('Save not supported in this environment');
    }
}

function loadSnakeCustomization() {
    try {
        // In a real application: var saved = localStorage.getItem('snakeCustomization');
        // if (saved) snakeData = JSON.parse(saved);
        console.log('Snake customization loaded');
    } catch(e) {
        console.log('Load not supported in this environment');
    }
    
    // Set active states based on loaded data
    setActiveSelections();
}

function setActiveSelections() {
    // Set active color
    document.querySelectorAll('.color-swatch').forEach(function(swatch) {
        swatch.classList.remove('active');
        if (swatch.dataset.color === snakeData.color.name) {
            swatch.classList.add('active');
        }
    });
    
    // Set active pattern
    document.querySelectorAll('.pattern-btn').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.dataset.pattern === snakeData.pattern) {
            btn.classList.add('active');
        }
    });
    
    // Set active accessory
    document.querySelectorAll('.accessory-btn').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.dataset.accessory === snakeData.accessory) {
            btn.classList.add('active');
        }
    });
    
    updateStyleDisplay();
}

// Function to get current snake customization (to be used by main game)
function getSnakeCustomization() {
    return snakeData;
}

// Function to apply customization to main game snake
function applyCustomizationToMainSnake() {
    // Update the main game's snake colors
    if (typeof snakeColors !== 'undefined') {
        snakeColors.bodyPrimary = snakeData.color.primary;
        snakeColors.bodySecondary = snakeData.color.secondary;
        snakeColors.bodyDark = snakeData.color.dark;
        snakeColors.head = snakeData.color.primary;
    }
}

// Utility functions
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getPetStats() {
    // This should return the current pet stats from the main game
    // For now, return default values
    if (typeof petStats !== 'undefined') {
        return {
            feedCount: petStats.feedCount || 0,
            happiness: petStats.happiness || 50,
            size: petStats.size || 25,
            playHighScore: petStats.playHighScore || 0,
            happyDays: petStats.happyDays || 0
        };
    }
    
    return {
        feedCount: 0,
        happiness: 50,
        size: 25,
        playHighScore: 0,
        happyDays: 0
    };
}

// Function to open customization screen
function openCustomization() {
    gameMode = 'customize';
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('customizeScreen').classList.remove('hidden');
    
    // Hide other game mode screens
    var feedMode = document.getElementById('feedMode');
    if (feedMode) {
        feedMode.classList.add('hidden');
    }
    
    // Initialize customization if not already done
    if (!previewCanvas) {
        setTimeout(initCustomization, 100); // Small delay to ensure DOM is ready
    } else {
        updateUnlockStatus();
    }
}

// Enhanced back to menu function
function backToMenuFromCustomize() {
    gameMode = 'menu';
    document.getElementById('customizeScreen').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
    
    // Apply customization to main snake when leaving customize mode
    applyCustomizationToMainSnake();
}