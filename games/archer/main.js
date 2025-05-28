import Bow3D from './bow3d.js';

// Game state
const gameState = {
    score: 0,
    arrows: [],      // Arrows in flight
    hitArrows: [],   // Arrows that have hit the target and should stay there
    isAiming: false,
    pullStart: { x: 0, y: 0 },
    currentPull: { x: 0, y: 0 },
    maxPullDistance: 150,
    timeRemaining: 30, // 30 seconds game time
    gameActive: true,
    perspective: {
        targetDistance: 100,
        fieldOfView: 45,
        targetSize: 200
    }
};

// Initialize 3D bow
const bowContainer = document.getElementById('bow-container');
const bow3D = new Bow3D(bowContainer);

// Fix body overflow
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.querySelector('.game-container').style.overflow = 'hidden';

// Create canvas for arrows
const canvas = document.createElement('canvas');
canvas.id = 'bow-canvas';
canvas.style.position = 'absolute';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.pointerEvents = 'auto';
document.querySelector('.game-container').appendChild(canvas);
const ctx = canvas.getContext('2d');

// Create score display
const scoreDisplay = document.createElement('div');
scoreDisplay.style.position = 'absolute';
scoreDisplay.style.top = '20px';
scoreDisplay.style.left = '20px';
scoreDisplay.style.fontSize = '24px';
scoreDisplay.style.fontFamily = 'Arial, sans-serif';
scoreDisplay.style.zIndex = '1000';
scoreDisplay.textContent = 'Score: 0';
document.querySelector('.game-container').appendChild(scoreDisplay);

// Also get the HTML score and countdown elements
const htmlScoreElement = document.getElementById('score');
const countdownElement = document.getElementById('countdown');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Get target element and its properties
const target = document.querySelector('.target');
target.style.position = 'absolute';
target.style.left = '51.25%';
target.style.top = '50%';
target.style.transform = 'translate(-50%, -50%) scale(0.33)';
target.style.zIndex = '40'; // Ensure target is behind the canvas but visible

// Function to get updated target position - call this whenever we need the current position
function getTargetRect() {
    return target.getBoundingClientRect();
}

// Initial target rectangle - will be updated during hit detection
let targetRect = getTargetRect();

// Calculate 3D position with enhanced perspective
function calculate3DPosition(x, y, z) {
    const fov = gameState.perspective.fieldOfView * (Math.PI / 180);
    const scale = 1 / Math.tan(fov / 2);
    
    // Enhanced perspective projection
    const perspectiveScale = 1 / (z + scale);
    const projectedX = (x * scale * perspectiveScale) * canvas.width;
    const projectedY = (y * scale * perspectiveScale) * canvas.height;
    
    return { 
        x: projectedX,
        y: projectedY,
        scale: perspectiveScale
    };
}

// Calculate points based on ring hit
function calculatePoints(x, y) {
    // Calculate points based on distance from center of target
    // Get the CURRENT target position
    const currentTargetRect = getTargetRect();
    const centerX = currentTargetRect.left + currentTargetRect.width / 2;
    const centerY = currentTargetRect.top + currentTargetRect.height / 2;
    
    // Calculate distance
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate hit percentage (how far from center relative to target radius)
    const maxRadius = currentTargetRect.width / 2;
    const hitPercentage = distance / maxRadius;
    
    console.log('SCORING - Arrow position:', x, y);
    console.log('SCORING - Target center:', centerX, centerY);
    console.log('SCORING - Distance:', distance);
    console.log('SCORING - Max radius:', maxRadius);
    console.log('SCORING - Hit percentage:', hitPercentage);
    
    // Standard archery target scoring system
    // The smaller the percentage (closer to center), the higher the score
    let points = 0;
    let ringHit = "MISS";
    
    // FORCE A MINIMUM SCORE FOR DEBUGGING
    // This ensures that any hit within 1.5x the target radius gets at least 1 point
    if (hitPercentage <= 1.5) {
        // Default to 1 point minimum for any hit
        points = 1;
        ringHit = "Edge Hit (1)";
        
        // Then check for higher-scoring rings
        if (hitPercentage <= 0.1) {
            points = 10; // Inner yellow (bullseye)
            ringHit = "Bullseye (10)";
        } else if (hitPercentage <= 0.2) {
            points = 9; // Outer yellow
            ringHit = "Outer Yellow (9)";
        } else if (hitPercentage <= 0.3) {
            points = 8; // Inner red
            ringHit = "Inner Red (8)";
        } else if (hitPercentage <= 0.4) {
            points = 7; // Outer red
            ringHit = "Outer Red (7)";
        } else if (hitPercentage <= 0.5) {
            points = 6; // Inner blue
            ringHit = "Inner Blue (6)";
        } else if (hitPercentage <= 0.6) {
            points = 5; // Outer blue
            ringHit = "Outer Blue (5)";
        } else if (hitPercentage <= 0.7) {
            points = 4; // Inner black
            ringHit = "Inner Black (4)";
        } else if (hitPercentage <= 0.8) {
            points = 3; // Outer black
            ringHit = "Outer Black (3)";
        } else if (hitPercentage <= 0.9) {
            points = 2; // Inner white
            ringHit = "Inner White (2)";
        } else if (hitPercentage <= 1.0) {
            points = 1; // Outer white
            ringHit = "Outer White (1)";
        }
    }
    
    console.log('RING HIT:', ringHit);
    console.log('POINTS AWARDED:', points);
    return points;
}

// Calculate pull force and direction
function calculatePullForce() {
    const dx = gameState.currentPull.x - gameState.pullStart.x;
    const dy = gameState.currentPull.y - gameState.pullStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate angle towards target
    const targetX = window.innerWidth / 2;
    const targetY = window.innerHeight / 2;
    const angle = Math.atan2(
        targetY - gameState.pullStart.y,
        targetX - gameState.pullStart.x
    );
    
    // Normalize pull distance
    const normalizedPull = Math.min(distance, gameState.maxPullDistance) / gameState.maxPullDistance;
    
    return {
        force: normalizedPull * 20,
        angle: angle,
        distance: distance
    };
}

// Arrow class with enhanced 3D movement and physics
class Arrow {
    constructor(start, target, power = 1.0, scoringData = null) {
        // start: {x, y, z}, target: {x, y, z}
        this.position = { ...start };
        this.startPosition = { ...start };
        this.target = { ...target };
        this.targetZ = target.z; // Store target Z for hit detection
        
        // Store scoring data if provided (from crosshair position)
        this.scoringData = scoringData;
        // Calculate normalized direction vector
        const dx = target.x - start.x;
        const dy = target.y - start.y;
        const dz = target.z - start.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        this.direction = {
            x: dx / dist,
            y: dy / dist,
            z: dz / dist
        };
        this.power = power;
        this.baseSpeed = 15; // Increased speed for faster arrows
        this.speed = this.baseSpeed * power;
        this.hasHit = false;
        this.targetPosition = null;
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionDuration = 0.5;
        this.transitionTime = 0;
        this.scale = 1.0;
        this.initialScale = 1.0;
        this.targetScale = 0.1; // Arrow gets much smaller at target
        this.gravity = 0.15; // Increased gravity for more realistic arc
        this.flightTime = 0;
        this.trail = [];
        this.maxTrailLength = 15; // Reduced trail length
        this.wobble = { amplitude: 0.1, frequency: 0.2, phase: 0 }; // Less wobble
        
        // Calculate the total flight distance for scaling
        this.totalDistance = dist;
        this.distanceTraveled = 0;
    }

    update(deltaTime = 0.016) { // Default to 60fps if no deltaTime provided
        if (this.hasHit && this.isTransitioning) {
            // Handle smooth transition to target position
            this.transitionTime += deltaTime;
            this.transitionProgress = Math.min(1, this.transitionTime / this.transitionDuration);
            
            // Ease-out easing function
            const easeProgress = 1 - Math.pow(1 - this.transitionProgress, 3);
            
            // Interpolate position
            this.position.x = this.startTransitionPosition.x + 
                (this.targetPosition.x - this.startTransitionPosition.x) * easeProgress;
            this.position.y = this.startTransitionPosition.y + 
                (this.targetPosition.y - this.startTransitionPosition.y) * easeProgress;
            this.position.z = this.startTransitionPosition.z + 
                (this.targetPosition.z - this.startTransitionPosition.z) * easeProgress;
            
            // Apply shrinking effect
            this.scale = this.initialScale + (this.targetScale - this.initialScale) * easeProgress;
            
            // Check if transition is complete
            if (this.transitionProgress >= 1) {
                this.isTransitioning = false;
            }
            
            return true;
        }
        else if (this.hasHit) {
            // Arrow is at target position - keep it fixed at the target position
            // DO NOT apply any physics or movement to arrows that have hit the target
            return true;
        }
        
        // Arrow flight logic with realistic physics
        this.flightTime += deltaTime;
        if (this.trail.length >= this.maxTrailLength) this.trail.shift();
        this.trail.push({ ...this.position });
        
        // Calculate previous position for distance tracking
        const prevX = this.position.x;
        const prevY = this.position.y;
        const prevZ = this.position.z;
        
        // Move arrow with realistic gravity arc
        const gravityEffect = this.gravity * this.flightTime * this.flightTime; // Quadratic gravity
        this.position.x += this.direction.x * this.speed * deltaTime * 60; // Normalize for 60fps
        this.position.y += this.direction.y * this.speed * deltaTime * 60 + gravityEffect;
        this.position.z += this.direction.z * this.speed * deltaTime * 60;
        
        // Calculate distance traveled in this frame
        const frameDx = this.position.x - prevX;
        const frameDy = this.position.y - prevY;
        const frameDz = this.position.z - prevZ;
        this.distanceTraveled += Math.sqrt(frameDx * frameDx + frameDy * frameDy + frameDz * frameDz);
        
        // Calculate scaling based on distance traveled (perspective effect)
        const progressRatio = Math.min(this.distanceTraveled / this.totalDistance, 1);
        this.scale = this.initialScale * (1 - progressRatio * 0.7); // Arrow gets smaller as it flies
        
        // Subtle wobble that decreases over time for realism
        const wobbleDecay = Math.max(0, 1 - progressRatio);
        this.wobble.phase += this.wobble.frequency * deltaTime * 60;
        const wobbleAmount = this.wobble.amplitude * Math.sin(this.wobble.phase) * wobbleDecay;
        
        // Hit detection: stop when close to target (crosshair position)
        const targetDx = this.position.x - this.target.x;
        const targetDy = this.position.y - this.target.y;
        const targetDz = this.position.z - this.target.z;
        const dist = Math.sqrt(targetDx * targetDx + targetDy * targetDy + targetDz * targetDz);
        if (dist < 10) { // Smaller detection radius for more precise stopping
            // Stop exactly at the crosshair position
            this.position.x = this.target.x;
            this.position.y = this.target.y;
            this.position.z = this.target.z;
            
            // Get the CURRENT target position (important to get accurate position)
            targetRect = getTargetRect();
            const targetCenter = {
                x: targetRect.left + targetRect.width / 2,
                y: targetRect.top + targetRect.height / 2
            };
            
            // Use actual target size for hit detection
            const targetRadius = targetRect.width / 2;
            
            // Debug markers for scoring zones have been removed
            
            // Calculate projected position for display purposes
            const projected = calculate3DPosition(this.position.x, this.position.y, this.position.z);
            
            // Calculate distance to actual target for scoring
            const dx = projected.x - targetCenter.x;
            const dy = projected.y - targetCenter.y;
            const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
            // Calculate hit percentage for scoring (how far from center relative to target radius)
            const hitPercentage = distanceToCenter / targetRadius;
            
            // Determine if the arrow hit the target (within the target radius)
            // Use a much more lenient hit detection for better gameplay
            const isHit = hitPercentage <= 1.5; // 1.5x target radius for better hit detection
            console.log('Is hit?', isHit);
            
            // Force debug info to console
            console.log('IMPORTANT DEBUG - Arrow position:', projected.x, projected.y);
            console.log('IMPORTANT DEBUG - Target center:', targetCenter.x, targetCenter.y);
            console.log('IMPORTANT DEBUG - Distance to center:', distanceToCenter);
            console.log('IMPORTANT DEBUG - Target radius:', targetRadius);
            console.log('IMPORTANT DEBUG - Hit percentage:', hitPercentage);
            console.log('IMPORTANT DEBUG - Is hit?', isHit);
            
            // Always count as a hit for now to debug scoring
            if (isHit) {
                this.hasHit = true;
                
                // Create a DOM element for the stuck arrow instead of using canvas
                const stuckArrow = document.createElement('div');
                stuckArrow.className = 'stuck-arrow';
                stuckArrow.style.position = 'absolute';
                stuckArrow.style.left = `${projected.x}px`;
                stuckArrow.style.top = `${projected.y}px`;
                
                // Add a small dot at the exact hit point for debugging
                const hitPoint = document.createElement('div');
                hitPoint.style.position = 'absolute';
                hitPoint.style.left = '0';
                hitPoint.style.top = '0';
                hitPoint.style.width = '6px';
                hitPoint.style.height = '6px';
                hitPoint.style.backgroundColor = 'lime';
                hitPoint.style.borderRadius = '50%';
                hitPoint.style.transform = 'translate(-50%, -50%)';
                hitPoint.style.zIndex = '1002';
                stuckArrow.appendChild(hitPoint);
                
                // Calculate rotation angle
                const rotationAngle = Math.atan2(
                    this.direction.y,
                    this.direction.x
                ) * (180 / Math.PI); // Convert to degrees for CSS
                
                // Set arrow styles
                stuckArrow.style.width = '36px';
                stuckArrow.style.height = '6px';
                stuckArrow.style.backgroundColor = 'black';
                stuckArrow.style.transform = `rotate(${rotationAngle}deg)`;
                stuckArrow.style.transformOrigin = 'left center';
                stuckArrow.style.zIndex = '1000';
                
                // Add arrowhead
                const arrowHead = document.createElement('div');
                arrowHead.style.position = 'absolute';
                arrowHead.style.right = '-2px';
                arrowHead.style.top = '-4px';
                arrowHead.style.width = '0';
                arrowHead.style.height = '0';
                arrowHead.style.borderTop = '6px solid transparent';
                arrowHead.style.borderBottom = '6px solid transparent';
                arrowHead.style.borderLeft = '10px solid black';
                stuckArrow.appendChild(arrowHead);
                
                // Add fletching
                const fletching = document.createElement('div');
                fletching.style.position = 'absolute';
                fletching.style.left = '0';
                fletching.style.top = '-4px';
                fletching.style.width = '0';
                fletching.style.height = '0';
                fletching.style.borderTop = '6px solid transparent';
                fletching.style.borderBottom = '6px solid transparent';
                fletching.style.borderRight = '8px solid black';
                stuckArrow.appendChild(fletching);
                
                // Add to the game container
                document.querySelector('.game-container').appendChild(stuckArrow);
                
                // Store a reference to the DOM element
                const arrowInfo = {
                    element: stuckArrow,
                    timestamp: Date.now()
                };
                gameState.hitArrows.push(arrowInfo);
                
                // Keep these for the transition animation
                this.targetPosition = { 
                    x: this.position.x,
                    y: this.position.y,
                    z: this.targetZ - 10 // Slightly in front
                };
                
                this.startTransitionPosition = {...this.position};
                this.isTransitioning = true;
                this.transitionTime = 0;
                
                // Calculate points based on arrow position
                // IMPORTANT: We need to pass the EXACT arrow position for accurate scoring
                console.log('CALCULATING POINTS FOR ARROW AT:', projected.x, projected.y);
                
                // Force the hitPercentage calculation here to ensure it's accurate
                // IMPORTANT: We need to use the EXACT same coordinates for both the visual arrow and scoring
                const arrowX = projected.x;
                const arrowY = projected.y;
                
                // Create a visual indicator showing exactly which point is being used for scoring
                const scorePoint = document.createElement('div');
                scorePoint.style.position = 'absolute';
                scorePoint.style.left = `${arrowX}px`;
                scorePoint.style.top = `${arrowY}px`;
                scorePoint.style.width = '8px';
                scorePoint.style.height = '8px';
                scorePoint.style.backgroundColor = 'yellow';
                scorePoint.style.borderRadius = '50%';
                scorePoint.style.transform = 'translate(-50%, -50%)';
                scorePoint.style.zIndex = '1003';
                scorePoint.style.boxShadow = '0 0 5px 2px yellow';
                document.body.appendChild(scorePoint);
                
                // Add a label to the score point
                const scoreLabel = document.createElement('div');
                scoreLabel.style.position = 'absolute';
                scoreLabel.style.left = '15px';
                scoreLabel.style.top = '-15px';
                scoreLabel.style.color = 'yellow';
                scoreLabel.style.fontWeight = 'bold';
                scoreLabel.style.fontSize = '12px';
                scoreLabel.style.textShadow = '1px 1px 2px black';
                scoreLabel.textContent = 'ARROW POSITION';
                scorePoint.appendChild(scoreLabel);
                
                // Remove score point after 5 seconds
                setTimeout(() => {
                    if (scorePoint.parentNode) scorePoint.parentNode.removeChild(scorePoint);
                }, 5000);
                
                // Use the pre-calculated score from the crosshair position
                // This is much more accurate than trying to calculate score based on where the arrow lands
                
                // Check if this arrow already has scoring data
                let points = 0;
                let ringHit = "MISS";
                
                if (this.scoringData && this.scoringData.scored) {
                    // Use the pre-calculated score from when the arrow was fired
                    points = this.scoringData.points;
                    ringHit = this.scoringData.ringHit;
                    
                    // No need to update the game score since it was already updated when the arrow was fired
                } else {
                    // Fallback to calculating score based on arrow position
                    // This should rarely happen since we're now calculating score when the arrow is fired
                    
                    const dx = arrowX - targetCenter.x;
                    const dy = arrowY - targetCenter.y;
                    const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
                    const hitPercentage = distanceToCenter / targetRadius;
                    
                    if (hitPercentage <= 1.5) {
                        // Default to 1 point minimum for any hit
                        points = 1;
                        ringHit = "Edge Hit (1)";
                        
                        // Then check for higher-scoring rings
                        if (hitPercentage <= 0.1) {
                            points = 10; // Inner yellow (bullseye)
                            ringHit = "Bullseye (10)";
                        } else if (hitPercentage <= 0.2) {
                            points = 9; // Outer yellow
                            ringHit = "Outer Yellow (9)";
                        } else if (hitPercentage <= 0.3) {
                            points = 8; // Inner red
                            ringHit = "Inner Red (8)";
                        } else if (hitPercentage <= 0.4) {
                            points = 7; // Outer red
                            ringHit = "Outer Red (7)";
                        } else if (hitPercentage <= 0.5) {
                            points = 6; // Inner blue
                            ringHit = "Inner Blue (6)";
                        } else if (hitPercentage <= 0.6) {
                            points = 5; // Outer blue
                            ringHit = "Outer Blue (5)";
                        } else if (hitPercentage <= 0.7) {
                            points = 4; // Inner black
                            ringHit = "Inner Black (4)";
                        } else if (hitPercentage <= 0.8) {
                            points = 3; // Outer black
                            ringHit = "Outer Black (3)";
                        } else if (hitPercentage <= 0.9) {
                            points = 2; // Inner white
                            ringHit = "Inner White (2)";
                        } else if (hitPercentage <= 1.0) {
                            points = 1; // Outer white
                            ringHit = "Outer White (1)";
                        }
                    }
                    
                    // Update the score if it wasn't already updated
                    gameState.score += points;
                }
                
                // Create a text display showing which ring was hit
                const ringDisplay = document.createElement('div');
                ringDisplay.style.position = 'absolute';
                ringDisplay.style.left = `${arrowX + 30}px`;
                ringDisplay.style.top = `${arrowY}px`;
                ringDisplay.style.padding = '5px 10px';
                ringDisplay.style.backgroundColor = 'rgba(0,0,0,0.7)';
                ringDisplay.style.color = 'white';
                ringDisplay.style.borderRadius = '5px';
                ringDisplay.style.fontWeight = 'bold';
                ringDisplay.style.zIndex = '1004';
                ringDisplay.textContent = `Ring: ${ringHit} (${points} points)`;
                document.body.appendChild(ringDisplay);
                
                // Remove ring display after 5 seconds
                setTimeout(() => {
                    if (ringDisplay.parentNode) ringDisplay.parentNode.removeChild(ringDisplay);
                }, 5000);
                
                // Add a small black dot to indicate where the arrow hit the target
                const hitMarker = document.createElement('div');
                hitMarker.style.position = 'absolute';
                hitMarker.style.left = `${arrowX}px`;
                hitMarker.style.top = `${arrowY}px`;
                hitMarker.style.width = '6px';
                hitMarker.style.height = '6px';
                hitMarker.style.backgroundColor = 'black';
                hitMarker.style.borderRadius = '50%';
                hitMarker.style.transform = 'translate(-50%, -50%)';
                hitMarker.style.zIndex = '50'; // Lower z-index so it appears under game over screen
                hitMarker.style.boxShadow = '0 0 2px 1px rgba(0,0,0,0.5)'; // Add subtle shadow for visibility
                document.body.appendChild(hitMarker);
                
                // Store the hit marker with the arrow info so it stays on the target
                arrowInfo.hitMarker = hitMarker;
                
                // Only play the hit sound without updating the score display
                // (Score is already displayed when the arrow is fired)
                if (points > 0) {
                    // Play a sound based on the points earned
                    this.playHitSound(points);
                }
                
                // Always update the main score display
                scoreDisplay.textContent = `Score: ${gameState.score}`;
                
                this.createHitEffect(projected.x, projected.y);
                return true;
            } else {
                // Arrow missed the target
                // No need to show MISS message here since it's already shown when the arrow is fired
                return false;
            }
        }
        
        if (this.position.z > this.target.z + 300) {
            return false;
        }
        
        return true;
    }

    draw() {
        // Only draw trail for arrows in flight (not hit arrows)
        if (!this.hasHit && this.trail.length > 1) {
            ctx.save();
            ctx.beginPath();
            
            // Create gradient trail that fades out
            for (let i = 1; i < this.trail.length; i++) {
                const opacity = 0.7 * (i / this.trail.length); // Trail gets more visible toward the arrow
                ctx.beginPath();
                ctx.moveTo(this.trail[i-1].x, this.trail[i-1].y);
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
                ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
                ctx.lineWidth = 2 * (i / this.trail.length); // Trail gets thicker toward the arrow
                ctx.stroke();
            }
            
            ctx.restore();
        }
        
        // Calculate arrow size based on distance and scale
        const baseArrowSize = 36;
        const arrowSize = baseArrowSize * this.scale;
        
        ctx.save();
        
        // Use the stored final position for arrows that have hit the target
        if (this.hasHit && this.finalHitPosition) {
            ctx.translate(this.finalHitPosition.x, this.finalHitPosition.y);
        } else {
            ctx.translate(this.position.x, this.position.y);
        }
        
        // Calculate rotation - use a fixed angle for hit arrows
        let velocityAngle;
        if (this.hasHit) {
            // Use the stored final rotation angle for hit arrows
            velocityAngle = this.finalRotationAngle || Math.atan2(
                this.direction.y,
                this.direction.x
            );
        } else {
            // Calculate dynamic angle for arrows in flight
            velocityAngle = Math.atan2(
                this.direction.y * this.speed + this.gravity * this.flightTime,
                this.direction.x * this.speed
            );
        }
        ctx.rotate(velocityAngle);
        
        ctx.globalAlpha = 0.95;
        
        // Arrow shaft - thin and black
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(arrowSize, 0);
        ctx.strokeStyle = '#000000'; // Black color
        ctx.lineWidth = arrowSize / 12; // Thinner line
        ctx.shadowColor = '#333';
        ctx.shadowBlur = 2;
        ctx.stroke();
        
        // Arrow head - black
        ctx.beginPath();
        ctx.moveTo(arrowSize, 0);
        ctx.lineTo(arrowSize - arrowSize/3, -arrowSize/6); // Narrower
        ctx.lineTo(arrowSize - arrowSize/3, arrowSize/6); // Narrower
        ctx.closePath();
        ctx.fillStyle = '#000000'; // Black
        ctx.fill();
        
        // Fletching - black
        ctx.beginPath();
        ctx.moveTo(arrowSize/6, 0);
        ctx.lineTo(0, -arrowSize/6); // Narrower
        ctx.lineTo(0, arrowSize/6); // Narrower
        ctx.closePath();
        ctx.fillStyle = '#000000'; // Black
        ctx.fill();
        
        ctx.restore();
    }
    // Remove all unreachable and duplicate code below (old drawing logic)

    createHitEffect(x, y) {
        // Use body instead of game-container to ensure effects are on top of everything
        const gameContainer = document.body;
        const points = calculatePoints(x, y);
        
        // 1. Create main impact flash
        const hitFlash = document.createElement('div');
        hitFlash.className = 'hit-effect hit-flash';
        hitFlash.style.position = 'absolute';
        hitFlash.style.left = `${x}px`;
        hitFlash.style.top = `${y}px`;
        hitFlash.style.width = '50px';
        hitFlash.style.height = '50px';
        hitFlash.style.borderRadius = '50%';
        hitFlash.style.background = 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,0,0.8) 40%, rgba(255,0,0,0.6) 70%, rgba(0,0,0,0) 100%)';
        hitFlash.style.boxShadow = '0 0 30px rgba(255, 255, 0, 0.8), 0 0 60px rgba(255, 0, 0, 0.6)';
        hitFlash.style.transform = 'translate(-50%, -50%)';
        hitFlash.style.pointerEvents = 'none';
        hitFlash.style.zIndex = '9999';
        gameContainer.appendChild(hitFlash);
        
        // 2. Create expanding rings (3 rings with different speeds and colors)
        for (let i = 0; i < 3; i++) {
            const ring = document.createElement('div');
            ring.className = 'hit-effect hit-ring';
            ring.style.position = 'absolute';
            ring.style.left = `${x}px`;
            ring.style.top = `${y}px`;
            ring.style.width = '20px';
            ring.style.height = '20px';
            ring.style.borderRadius = '50%';
            ring.style.border = `2px solid ${i === 0 ? 'white' : i === 1 ? 'yellow' : 'red'}`;
            ring.style.transform = 'translate(-50%, -50%)';
            ring.style.pointerEvents = 'none';
            ring.style.opacity = '0.8';
            ring.style.zIndex = '9998';
            gameContainer.appendChild(ring);
            
            // Animate ring expansion with different delays
            setTimeout(() => {
                ring.style.transition = `all ${0.6 + i * 0.2}s ease-out`;
                ring.style.width = '120px';
                ring.style.height = '120px';
                ring.style.opacity = '0';
                
                setTimeout(() => {
                    if (ring.parentNode) {
                        ring.parentNode.removeChild(ring);
                    }
                }, (0.6 + i * 0.2) * 1000);
            }, i * 100);
        }
        
        // 3. Create score indicator that floats up
        if (points > 0) {
            const scoreIndicator = document.createElement('div');
            scoreIndicator.className = 'hit-effect score-indicator';
            scoreIndicator.style.position = 'absolute';
            scoreIndicator.style.left = `${x}px`;
            scoreIndicator.style.top = `${y}px`;
            scoreIndicator.style.transform = 'translate(-50%, -50%)';
            scoreIndicator.style.color = points >= 9 ? 'gold' : 
                                        points >= 7 ? 'orange' : 
                                        points >= 5 ? 'lightblue' : 'white';
            scoreIndicator.style.fontFamily = 'Arial, sans-serif';
            scoreIndicator.style.fontSize = points >= 9 ? '36px' : '30px';
            scoreIndicator.style.fontWeight = 'bold';
            scoreIndicator.style.textShadow = '0 0 10px rgba(0,0,0,0.8)';
            scoreIndicator.style.pointerEvents = 'none';
            scoreIndicator.style.zIndex = '10000';
            scoreIndicator.textContent = `+${points}`;
            gameContainer.appendChild(scoreIndicator);
            
            // Animate score floating up
            setTimeout(() => {
                scoreIndicator.style.transition = 'all 1s ease-out';
                scoreIndicator.style.transform = 'translate(-50%, -150%)';
                scoreIndicator.style.opacity = '0';
                
                setTimeout(() => {
                    if (scoreIndicator.parentNode) {
                        scoreIndicator.parentNode.removeChild(scoreIndicator);
                    }
                }, 1000);
            }, 200);
        }
        
        // 4. Create particles
        const particleCount = 20 + points * 2; // More particles for better scores
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'hit-effect hit-particle';
            particle.style.position = 'absolute';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.width = `${2 + Math.random() * 4}px`;
            particle.style.height = particle.style.width;
            particle.style.borderRadius = '50%';
            
            // Different colors based on score
            let particleColor;
            if (points >= 9) {
                particleColor = ['gold', 'yellow', 'white'][Math.floor(Math.random() * 3)];
            } else if (points >= 7) {
                particleColor = ['red', 'orange', 'yellow'][Math.floor(Math.random() * 3)];
            } else if (points >= 5) {
                particleColor = ['blue', 'lightblue', 'white'][Math.floor(Math.random() * 3)];
            } else {
                particleColor = ['white', 'gray', 'darkgray'][Math.floor(Math.random() * 3)];
            }
            
            particle.style.backgroundColor = particleColor;
            particle.style.boxShadow = `0 0 3px ${particleColor}`;
            particle.style.transform = 'translate(-50%, -50%)';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9997';
            gameContainer.appendChild(particle);
            
            // Random direction and speed for each particle
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            const distance = 30 + Math.random() * 70;
            const duration = 0.5 + Math.random() * 0.5;
            
            // Animate particle
            setTimeout(() => {
                particle.style.transition = `all ${duration}s ease-out`;
                particle.style.transform = `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px))`;
                particle.style.opacity = '0';
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, duration * 1000);
            }, Math.random() * 100);
        }
        
        // 5. Remove main flash after animation
        setTimeout(() => {
            hitFlash.style.transition = 'all 0.5s ease-out';
            hitFlash.style.opacity = '0';
            hitFlash.style.transform = 'translate(-50%, -50%) scale(2.5)';
            
            setTimeout(() => {
                if (hitFlash.parentNode) {
                    hitFlash.parentNode.removeChild(hitFlash);
                }
            }, 500);
        }, 200);
        
        // 6. Play hit sound
        this.playHitSound(points);
    }
    
    playHitSound(points) {
        // Create audio element
        const audio = new Audio();
        
        // Different sounds based on score
        if (points >= 9) {
            audio.src = 'assets/sounds/bullseye.mp3'; // You'll need to add these sound files
        } else if (points >= 7) {
            audio.src = 'assets/sounds/good-hit.mp3';
        } else if (points >= 1) {
            audio.src = 'assets/sounds/hit.mp3';
        } else {
            audio.src = 'assets/sounds/miss.mp3';
        }
        
        // Fallback in case sound files don't exist
        audio.onerror = function() {
            const fallbackAudio = new Audio();
            fallbackAudio.volume = 0.4;
            
            // Create oscillator for sound effect as fallback
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                // Different tones based on score
                if (points >= 9) {
                    oscillator.type = 'sine';
                    oscillator.frequency.value = 880; // A5
                } else if (points >= 7) {
                    oscillator.type = 'triangle';
                    oscillator.frequency.value = 659.25; // E5
                } else if (points >= 1) {
                    oscillator.type = 'square';
                    oscillator.frequency.value = 440; // A4
                } else {
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.value = 220; // A3
                }
                
                gainNode.gain.value = 0.1;
                oscillator.start();
                
                // Fade out
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
                setTimeout(() => oscillator.stop(), 500);
            } catch (e) {
                console.log('Web Audio API not supported');
            }
        };
        
        // Play the sound
        audio.volume = 0.4; // Not too loud
        audio.play().catch(e => console.log('Could not play sound:', e));
    }
}

// Game loop with time tracking for smooth animation
let lastTime = 0;
let lastSecondTime = 0;

function gameLoop(timestamp = 0) {
    const deltaTime = (timestamp - lastTime) / 1000; // Convert to seconds
    lastTime = timestamp;
    
    // Update countdown timer every second
    if (gameState.gameActive && timestamp - lastSecondTime >= 1000) {
        lastSecondTime = timestamp;
        gameState.timeRemaining--;
        
        if (countdownElement) {
            countdownElement.textContent = gameState.timeRemaining;
        }
        
        // End game when time runs out
        if (gameState.timeRemaining <= 0) {
            gameState.gameActive = false;
            endGame();
        }
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw arrows in flight with deltaTime for consistent speed
    gameState.arrows = gameState.arrows.filter(arrow => {
        // Update the arrow physics
        const stillValid = arrow.update(deltaTime);
        
        // Draw the arrow
        arrow.draw();
        
        // Keep arrows that are still in flight and haven't gone too far past the target
        return stillValid && arrow.position.z <= gameState.perspective.targetDistance * 1.5;
    });
    
    // We don't need to draw hit arrows on the canvas anymore
    // They are now DOM elements added directly to the game container
    
    requestAnimationFrame(gameLoop);
}

// End game function
function endGame() {
    // Create black overlay with 0.6 opacity
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'black';
    overlay.style.opacity = '0.6';
    overlay.style.zIndex = '999'; // Below game over message and restart button
    document.querySelector('.game-container').appendChild(overlay);
    
    // Display game over message
    const gameOverMsg = document.createElement('div');
    gameOverMsg.style.position = 'absolute';
    gameOverMsg.style.top = '50%';
    gameOverMsg.style.left = '50%';
    gameOverMsg.style.transform = 'translate(-50%, -50%)';
    gameOverMsg.style.fontSize = '48px';
    gameOverMsg.style.fontWeight = 'bold';
    gameOverMsg.style.color = 'white';
    gameOverMsg.style.textShadow = '0 0 10px rgba(0,0,0,0.8)';
    gameOverMsg.style.zIndex = '1000';
    gameOverMsg.textContent = 'Game Over!';
    document.querySelector('.game-container').appendChild(gameOverMsg);
    
    // Update high score if needed
    const highScoreElement = document.getElementById('highscore');
    if (highScoreElement) {
        const currentHighScore = parseInt(highScoreElement.textContent) || 0;
        if (gameState.score > currentHighScore) {
            highScoreElement.textContent = gameState.score;
            // Save high score to localStorage
            try {
                localStorage.setItem('archerHighScore', gameState.score);
            } catch (e) {
                console.log('Could not save high score to localStorage');
            }
        }
    }
    
    // Add restart button
    const restartBtn = document.createElement('button');
    restartBtn.style.position = 'absolute';
    restartBtn.style.top = '60%';
    restartBtn.style.left = '50%';
    restartBtn.style.transform = 'translate(-50%, -50%)';
    restartBtn.style.padding = '10px 20px';
    restartBtn.style.fontSize = '24px';
    restartBtn.style.backgroundColor = '#4CAF50';
    restartBtn.style.color = 'white';
    restartBtn.style.border = 'none';
    restartBtn.style.borderRadius = '5px';
    restartBtn.style.cursor = 'pointer';
    restartBtn.style.zIndex = '1001';
    restartBtn.textContent = 'Play Again';
    restartBtn.onclick = restartGame;
    document.querySelector('.game-container').appendChild(restartBtn);
}

// Restart game function
function restartGame() {
    // Remove game over message, overlay, and restart button
    // First, specifically remove the restart button (which is a button element, not a div)
    const restartButton = document.querySelector('.game-container > button');
    if (restartButton) {
        restartButton.remove();
    }
    
    // Then remove other game over elements (divs)
    const gameOverElements = document.querySelectorAll('.game-container > div:not(.target):not(.crosshair):not(#bow-container)');
    gameOverElements.forEach(el => {
        if (el.tagName.toLowerCase() !== 'canvas' && !el.classList.contains('ring') && 
            !el.classList.contains('bullseye') && !el.classList.contains('center-dot')) {
            el.remove();
        }
    });
    
    // Reset game state
    gameState.score = 0;
    gameState.timeRemaining = 30;
    gameState.gameActive = true;
    gameState.arrows = [];
    
    // Remove all stuck arrow DOM elements
    document.querySelectorAll('.stuck-arrow').forEach(arrow => {
        arrow.remove();
    });
    
    // Clear hit arrows array
    gameState.hitArrows = [];
    
    // Remove all black dot markers (both crosshair markers and arrow hit markers)
    document.querySelectorAll('div').forEach(el => {
        // Check if it's a marker dot (small black dots with z-index 50)
        if (el.style.backgroundColor === 'black' && 
            el.style.width === '6px' && 
            el.style.height === '6px' && 
            el.style.zIndex === '50') {
            el.remove();
        }
    });
    
    // Reset score displays
    scoreDisplay.textContent = 'Score: 0';
    if (htmlScoreElement) htmlScoreElement.textContent = '0';
    if (countdownElement) countdownElement.textContent = '30';
    
    // Reset last second time
    lastSecondTime = performance.now();
}

// --- Bow drag and 3D yaw effect ---
let isDraggingBow = false;
let dragOffset = { x: 0, y: 0 };
const crosshair = document.querySelector('.crosshair');
// Hide crosshair by default
crosshair.style.display = 'none';
let lastBowPosition = { x: 0, y: 0 };

function setBowToOriginalPosition() {
    bowContainer.style.right = '0px';
    bowContainer.style.left = '';
    bowContainer.style.top = '50%';
    bowContainer.style.transform = 'translateY(-50%)';
    
    // Reset 3D rotation and ensure bow is not in aiming mode
    bow3D.setAiming(false);
    bow3D.setPullDistance(0);
    bow3D.setYawAndPitch(Math.PI / 2, -Math.PI / 6);
    
    // Force bow to return to default position
    if (bow3D.bowModel) {
        bow3D.targetRotation.copy(bow3D.defaultState.rotation);
        bow3D.targetPosition.copy(bow3D.defaultState.position);
    }
}
setBowToOriginalPosition();

bowContainer.addEventListener('mousedown', (e) => {
    isDraggingBow = true;
    const rect = bowContainer.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    // Remove transform for dragging
    bowContainer.style.transform = '';
    // Remove right for dragging
    bowContainer.style.right = '';
    // Show crosshair when bow is grabbed
    crosshair.style.display = 'block';
    
    // Set bow to aiming position
    bow3D.setAiming(true);
    
    // Track pull start position for bow animation
    gameState.pullStart = {
        x: e.clientX,
        y: e.clientY
    };
    gameState.currentPull = {
        x: e.clientX,
        y: e.clientY
    };
    
    document.addEventListener('mousemove', onBowMouseMove);
    document.addEventListener('mouseup', onBowMouseUp);
});

function onBowMouseMove(e) {
    if (!isDraggingBow) return;
    // Move bow to follow mouse
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Update bow position
    bowContainer.style.left = newX + 'px';
    bowContainer.style.top = newY + 'px';
    
    // Calculate smooth crosshair movement
    const speed = 0.1; // Adjust this value for smoother/faster movement
    lastBowPosition.x += (newX - lastBowPosition.x) * speed;
    lastBowPosition.y += (newY - lastBowPosition.y) * speed;
    
    // Update crosshair position with 6cm offset from bow's position
    const bowRect = bowContainer.getBoundingClientRect();
    const bowCenterX = bowRect.left + (bowRect.width / 2);
    crosshair.style.left = (bowCenterX + 60) + 'px'; // 6cm in pixels (assuming 96dpi: 1cm = 37.8px)
    crosshair.style.top = (lastBowPosition.y - crosshair.offsetHeight / 2) + 'px';
    bowContainer.style.top = (e.clientY - dragOffset.y) + 'px';

    // Calculate horizontal position relative to center
    const screenCenterX = window.innerWidth / 2;
    const maxYaw = Math.PI / 4; // 45 degrees max yaw
    const percentFromCenter = (bowCenterX - screenCenterX) / (window.innerWidth / 2);
    const yaw = Math.PI / 2 - percentFromCenter * maxYaw;
    // Keep pitch constant
    bow3D.setYawAndPitch(yaw, -Math.PI / 6);
    
    // Update pull distance for bow animation
    gameState.currentPull = {
        x: e.clientX,
        y: e.clientY
    };
    
    // Calculate pull distance
    const dx = gameState.currentPull.x - gameState.pullStart.x;
    const dy = gameState.currentPull.y - gameState.pullStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const normalizedPull = Math.min(distance, gameState.maxPullDistance) / gameState.maxPullDistance;
    
    // Update bow string animation
    bow3D.setPullDistance(normalizedPull);
}

function onBowMouseUp(e) {
    if (!isDraggingBow) return;
    
    isDraggingBow = false;
    document.removeEventListener('mousemove', onBowMouseMove);
    document.removeEventListener('mouseup', onBowMouseUp);
    
    // Fire arrow before resetting bow position
    if (gameState.gameActive) {
        // Calculate pull force
        const pull = {
            force: 1.0, // Full force for better gameplay
            angle: 0
        };
        
        // Play bow sound
        playBowSound(pull.force);
        
        // Get bow and crosshair positions
        const bowRect = bowContainer.getBoundingClientRect();
        const bowCenterX = bowRect.left + (bowRect.width / 2);
        const bowCenterY = bowRect.top + (bowRect.height / 2);
        const crosshairRect = crosshair.getBoundingClientRect();
        const crosshairCenterX = crosshairRect.left + (crosshairRect.width / 2);
        const crosshairCenterY = crosshairRect.top + (crosshairRect.height / 2);
        
        // IMPORTANT: Store the crosshair position for scoring
        // This will be used later when the arrow hits the target
        const targetRect = getTargetRect();
        const targetCenter = {
            x: targetRect.left + targetRect.width / 2,
            y: targetRect.top + targetRect.height / 2
        };
        
        // Calculate distance from crosshair to target center for scoring
        const crosshairDx = crosshairCenterX - targetCenter.x;
        const crosshairDy = crosshairCenterY - targetCenter.y;
        const crosshairDistanceToCenter = Math.sqrt(crosshairDx * crosshairDx + crosshairDy * crosshairDy);
        const targetRadius = targetRect.width / 2;
        const crosshairHitPercentage = crosshairDistanceToCenter / targetRadius;
        
        // Add a small black dot to mark the crosshair position when the arrow is fired
        const crosshairMarker = document.createElement('div');
        crosshairMarker.style.position = 'absolute';
        crosshairMarker.style.left = `${crosshairCenterX}px`;
        crosshairMarker.style.top = `${crosshairCenterY}px`;
        crosshairMarker.style.width = '6px';
        crosshairMarker.style.height = '6px';
        crosshairMarker.style.backgroundColor = 'black';
        crosshairMarker.style.borderRadius = '50%';
        crosshairMarker.style.transform = 'translate(-50%, -50%)';
        crosshairMarker.style.zIndex = '50'; // Lower z-index so it appears under game over screen and crosshair
        crosshairMarker.style.boxShadow = '0 0 2px 1px rgba(0,0,0,0.5)'; // Add subtle shadow for visibility
        document.body.appendChild(crosshairMarker);
        
        // Calculate points based on crosshair position
        let points = 0;
        let ringHit = "MISS";
        
        if (crosshairHitPercentage <= 1.5) {
            // Default to 1 point minimum for any hit
            points = 1;
            ringHit = "Edge Hit (1)";
            
            // Then check for higher-scoring rings
            if (crosshairHitPercentage <= 0.1) {
                points = 10; // Inner yellow (bullseye)
                ringHit = "Bullseye (10)";
            } else if (crosshairHitPercentage <= 0.2) {
                points = 9; // Outer yellow
                ringHit = "Outer Yellow (9)";
            } else if (crosshairHitPercentage <= 0.3) {
                points = 8; // Inner red
                ringHit = "Inner Red (8)";
            } else if (crosshairHitPercentage <= 0.4) {
                points = 7; // Outer red
                ringHit = "Outer Red (7)";
            } else if (crosshairHitPercentage <= 0.5) {
                points = 6; // Inner blue
                ringHit = "Inner Blue (6)";
            } else if (crosshairHitPercentage <= 0.6) {
                points = 5; // Outer blue
                ringHit = "Outer Blue (5)";
            } else if (crosshairHitPercentage <= 0.7) {
                points = 4; // Inner black
                ringHit = "Inner Black (4)";
            } else if (crosshairHitPercentage <= 0.8) {
                points = 3; // Outer black
                ringHit = "Outer Black (3)";
            } else if (crosshairHitPercentage <= 0.9) {
                points = 2; // Inner white
                ringHit = "Inner White (2)";
            } else if (crosshairHitPercentage <= 1.0) {
                points = 1; // Outer white
                ringHit = "Outer White (1)";
            }
        }
        
        // Scoring is now based on crosshair position
        
        // Update score
        gameState.score += points;
        scoreDisplay.textContent = `Score: ${gameState.score}`;
        if (htmlScoreElement) htmlScoreElement.textContent = gameState.score.toString();
        
        // Hide the 3D arrow when shooting
        if (typeof bow3D.hideArrow === 'function') bow3D.hideArrow();

        // Display score immediately based on crosshair position
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            // First show the points earned with a + sign
            if (points > 0) {
                scoreElement.textContent = `+${points}`;
                scoreElement.style.color = 'green';
                scoreElement.style.fontWeight = 'bold';
                scoreElement.style.fontSize = '24px'; // Make it larger
                
                // Then update to show the total score after a short delay
                setTimeout(() => {
                    scoreElement.textContent = gameState.score;
                    scoreElement.style.color = ''; // Reset to default color
                    scoreElement.style.fontWeight = '';
                    scoreElement.style.fontSize = ''; // Reset size
                }, 1500);
            } else {
                // If no points earned, show MISS
                scoreElement.textContent = 'MISS';
                scoreElement.style.color = 'red';
                scoreElement.style.fontWeight = 'bold';
                scoreElement.style.fontSize = '24px'; // Make it larger
                
                // Restore the score after a short delay
                setTimeout(() => {
                    scoreElement.textContent = gameState.score;
                    scoreElement.style.color = ''; // Reset to default color
                    scoreElement.style.fontWeight = '';
                    scoreElement.style.fontSize = ''; // Reset size
                }, 1500);
            }
        }
        
        // Launch the 2D arrow from far right toward the crosshair (not all the way to the bow)
        // Calculate a position far behind the crosshair (opposite direction from bow)
        const crosshairToBowX = bowCenterX - crosshairCenterX;
        const crosshairToBowY = bowCenterY - crosshairCenterY;
        const distance = Math.sqrt(crosshairToBowX * crosshairToBowX + crosshairToBowY * crosshairToBowY);
        const normalizedX = crosshairToBowX / distance;
        const normalizedY = crosshairToBowY / distance;
        
        // Start position is 300 pixels behind the crosshair in the opposite direction of the bow
        const start = { 
            x: crosshairCenterX - normalizedX * 300, 
            y: crosshairCenterY - normalizedY * 300, 
            z: 0 
        };
        // Target is now the crosshair position instead of the bow
        const target = { x: crosshairCenterX, y: crosshairCenterY, z: gameState.perspective.targetDistance };
        
        // Pass the scoring info to the arrow so it doesn't try to calculate score again
        const arrowData = {
            points: points,
            ringHit: ringHit,
            scored: true // Flag to indicate this arrow already has a score
        };
        
        gameState.arrows.push(new Arrow(start, target, 1.0, arrowData));
        
        // Reset bow pull distance immediately to start the return animation
        bow3D.setPullDistance(0);
        
        // Ensure bow is no longer in aiming mode
        bow3D.setAiming(false);
        
        // Show the 3D arrow again after a short delay (simulate reload)
        setTimeout(() => {
            if (typeof bow3D.showArrow === 'function') bow3D.showArrow();
        }, 400);
    }
    
    // Reset bow position
    setBowToOriginalPosition();
    
    // Hide crosshair when bow is released
    crosshair.style.display = 'none';
    // Reset crosshair position
    crosshair.style.left = '6cm';
    crosshair.style.top = '50%';
    crosshair.style.transform = 'translateY(-50%)';
}

// Event listeners - REMOVED CANVAS EVENTS FOR ARROW FIRING
// Now arrow firing is handled exclusively in the onBowMouseUp function

// We'll keep these events for debugging purposes only
canvas.addEventListener('mousedown', (e) => {
    // This is now just for debugging - the real aiming happens when dragging the bow
    console.log('Canvas mousedown - for debugging only');
});

canvas.addEventListener('mousemove', (e) => {
    // This is now just for debugging - the real movement happens when dragging the bow
    console.log('Canvas mousemove - for debugging only');
});

canvas.addEventListener('mouseup', (e) => {
    // This is now just for debugging - the real firing happens when releasing the bow
    console.log('Canvas mouseup - for debugging only');
});

// Function to create a visual effect when the arrow is released
function createReleaseEffect(x, y) {
    const releaseEffect = document.createElement('div');
    releaseEffect.className = 'release-effect';
    releaseEffect.style.position = 'absolute';
    releaseEffect.style.left = `${x}px`;
    releaseEffect.style.top = `${y}px`;
    releaseEffect.style.width = '30px';
    releaseEffect.style.height = '30px';
    releaseEffect.style.borderRadius = '50%';
    releaseEffect.style.background = 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)';
    releaseEffect.style.transform = 'translate(-50%, -50%)';
    releaseEffect.style.pointerEvents = 'none';
    releaseEffect.style.zIndex = '1000';
    document.querySelector('.game-container').appendChild(releaseEffect);
    
    // Animate and remove
    setTimeout(() => {
        releaseEffect.style.transition = 'all 0.2s ease-out';
        releaseEffect.style.opacity = '0';
        releaseEffect.style.transform = 'translate(-50%, -50%) scale(3)';
        
        setTimeout(() => {
            if (releaseEffect.parentNode) {
                releaseEffect.parentNode.removeChild(releaseEffect);
            }
        }, 200);
    }, 50);
}

// Function to play bow sound with varying pitch based on pull force
function playBowSound(force) {
    // Simulate sound with visual feedback
    const bowSoundIndicator = document.createElement('div');
    bowSoundIndicator.className = 'bow-sound';
    bowSoundIndicator.style.position = 'fixed';
    bowSoundIndicator.style.bottom = '20px';
    bowSoundIndicator.style.left = '20px';
    bowSoundIndicator.style.color = 'white';
    bowSoundIndicator.style.fontSize = '12px';
    bowSoundIndicator.style.opacity = '0.7';
    bowSoundIndicator.style.fontFamily = 'Arial, sans-serif';
    bowSoundIndicator.textContent = `Bow sound: ${Math.floor(force * 10)}dB`;
    document.body.appendChild(bowSoundIndicator);
    
    // Remove after 1 second
    setTimeout(() => {
        bowSoundIndicator.style.transition = 'opacity 0.5s';
        bowSoundIndicator.style.opacity = '0';
        setTimeout(() => {
            if (bowSoundIndicator.parentNode) {
                bowSoundIndicator.parentNode.removeChild(bowSoundIndicator);
            }
        }, 500);
    }, 1000);
}

// Start the game
gameLoop();
