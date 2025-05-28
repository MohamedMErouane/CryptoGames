/*
On init
 On screen rotation
 Update the ball's initial position
*/

// Global variables
var timerInterval;
var timeLeft = 30;
var gameActive = false;

// Timer functions
function startTimer() {
  // Clear any existing timer
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  // Reset time left
  timeLeft = 60;
  document.getElementById("timer").innerHTML = "Time: " + timeLeft;
  
  // Start new timer
  timerInterval = setInterval(function() {
    timeLeft--;
    document.getElementById("timer").innerHTML = "Time: " + timeLeft;
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      gameActive = false;
      showTimeoutAnimation();
    }
  }, 1000);
}

function showTimeoutAnimation() {
  // Kill any existing animations
  TweenMax.killTweensOf("#goalText");
  
  // Reset goal text
  TweenMax.set("#goalText", {
    clearProps: "all",
    fontSize: "0px",
    opacity: 0,
    scale: 1,
    rotation: 0
  });
  
  // Change text to "TIME OUT!"
  document.getElementById("goalText").innerHTML = "TIME OUT!";
  
  // Show timeout text
  TweenMax.to("#goalText", 0.5, {
    fontSize: "150px",
    opacity: 1,
    ease: Back.easeOut
  });
  
  // Hide timeout text and return to start screen
  TweenMax.to("#goalText", 0.5, {
    fontSize: "0px",
    opacity: 0,
    ease: Power1.easeIn,
    delay: 1,
    onComplete: function() {
      // Hide game elements
      TweenMax.to(".stage", 0.5, {autoAlpha: 0});
      TweenMax.to(".copy", 0.5, {autoAlpha: 0});
      
      // Show start screen
      document.getElementById("startScreen").style.display = "flex";
      TweenMax.to("#startScreen", 0.5, {autoAlpha: 1});
      
      // Reset game state
      score = 0;
      shots = 0;
      hits = 0;
      timeLeft = 60;
      gameActive = false;
      
      // Update displays
      document.getElementById("score").innerHTML = "Score: " + score;
      document.getElementById("hits").innerHTML = "Hits: " + hits;
      document.getElementById("timer").innerHTML = "Time: " + timeLeft;
    }
  });
}

// wait until DOM is ready
document.addEventListener("DOMContentLoaded", function(event) {
    // Hide game elements initially
    TweenMax.set(".stage", {autoAlpha: 0});
    TweenMax.set(".copy", {autoAlpha: 0});
    TweenMax.set("#goalText", {autoAlpha: 0});

    // Add start button click handler
    document.getElementById("startButton").addEventListener("click", function() {
        // Hide start screen
        TweenMax.to("#startScreen", 0.5, {
            autoAlpha: 0,
            onComplete: function() {
                document.getElementById("startScreen").style.display = "none";
            }
        });

        // Show game elements
        TweenMax.to(".stage", 1, {autoAlpha: 1});
        TweenMax.to(".copy", 0.5, {autoAlpha: 1});
        
        // Reset game state
        score = 0;
        shots = 0;
        hits = 0;
        gameActive = true;
        document.getElementById("score").innerHTML = "Score: " + score;
        document.getElementById("hits").innerHTML = "Hits: " + hits;
        
        // Start the timer
        startTimer();
    });

    // wait until window, stylesheets, images, links, and other media assets are loaded
    window.onload = function() {
   
     // All ready, let's go!
   
   
     /* ***************************
     Things we are going to need
     **************************** */
   
     // A Vector
     var Vector = {
      _x: 1,
      _y: 0,
   
      create: function(x, y) {
      var obj = Object.create(this);
      obj.setX(x);
      obj.setY(y);
      return obj;
      },
   
      setX: function(value) {
      this._x = value;
      },
   
      getX: function() {
      return this._x
      },
   
      setY: function(value) {
      this._y = value;
      },
   
      getY: function() {
      return this._y;
      },
   
      setAngle: function(angle) {
      var length = this.getLength();
      this._x = Math.cos(angle) * length;
      this._y = Math.sin(angle) * length;
      },
   
      getAngle: function() {
      return Math.atan2(this._y, this._x);
      },
   
      setLength: function(length) {
      var angle = this.getAngle();
      this._x = Math.cos(angle) * length;
      this._y = Math.sin(angle) * length;
      },
   
      getLength: function() {
      return Math.sqrt(this._x * this._x + this._y * this._y);
      },
   
      add: function(v2) {
      return Vector.create(this._x + v2.getX(), this._y + v2.getY());
      },
   
      subtract: function(v2) {
      return Vector.create(this._x - v2.getX(), this._y - v2.getY());
      },
   
      scale: function(value) {
      return Vector.create(this._x * value, this._x * value);
      }
     };
   
   
   
     // A Particle
     var Particle = {
      position: null,
      velocity: null,
      gravity: null,
   
      create: function(x, y, speed, direction, grav) {
      var obj = Object.create(this);
      obj.position = Vector.create(x, y);
      obj.velocity = Vector.create(0, 0);
      obj.velocity.setLength(speed);
      obj.velocity.setAngle(direction);
      obj.gravity = Vector.create(0, grav || 0);
   
      return obj;
      },
   
      accelerate: function(vector) {
      this.velocity = this.velocity.add(vector);
      },
   
      update: function() {
      this.velocity = this.velocity.add(this.gravity);
      this.position = this.position.add(this.velocity);
      }
     };
   
   
   
     // Ball and basket vars
     var ball = document.getElementById("ball"),
         offsetY,
         ballRadius,
         basket = document.getElementById("basket"),
         basketWidth,
         ratio,
         scale,
         w,
         h;
   
     // Motion vars
     var p,
         start,
         force,
         timestamp = null,
         lastMouse,
         hasThrown = false,
         highEnough = false,
         lastY,
         rot;
   
     // Score vars
     var shots = 0,
         hits = 0,
         score = 0,
         accuracy = 0;
   
     
     
     window.addEventListener("resize", resize);
     window.addEventListener("orientationchange", resize);
     
     
     resize();
      
     
     // Wait a second before fading the elements in to prevent a flash of unpositioned/unstyled content
     TweenMax.to(".stage", 1, {autoAlpha:1, delay:1});
   
   
     
     
     
     
     function addEvents() {
   
      ball.addEventListener("mousedown", grabBall);
      ball.addEventListener("touchstart", grabBall);
      ball.addEventListener("mouseup", releaseBall);
      ball.addEventListener("touchend", releaseBall);
      
     }
     
     
     
     
     function removeEvents() {
   
      ball.removeEventListener("mousedown", grabBall);
      ball.removeEventListener("touchstart", grabBall);
      ball.removeEventListener("mouseup", releaseBall);
      ball.removeEventListener("touchend", releaseBall);
   
     }
     
   
   
   
     function resize() {
      
      // For some reason, we need to re-add the touch events every time the orientation change, if we don't the touchmove fails after the touchstart. Bizzarre.
      removeEvents();
      
      addEvents();
      
      
      offsetY = ball.getBoundingClientRect().height*1.5;
   
      // Find the smallest value of the SVG holding the basketball - it will give us the ball's radius
      ballRadius = Math.min(ball.getBoundingClientRect().width, ball.getBoundingClientRect().height);
   
      basketWidth = Math.round(basket.querySelector("rect").getBoundingClientRect().width);
   
      // Work out how the ratio between the basket's width and the ball's radius, make it a tiny smaller just for safety
      ratio = basketWidth / ballRadius - 0.2;
   
      w = window.innerWidth;
      h = window.innerHeight;
      
      // Make sure the basketall has no previous GSAP's transforms on it
      TweenMax.set(ball, {clearProps:"all"});
   
      // Move the basketball to its starting offset
     TweenMax.set(ball, {y:"+="+offsetY}); // We need a number rather than a percentage to use later with collision calculation.
   
      scale = TweenMax.to(ball, 0.5, {scale:ratio, ease:Power1.easeInOut}).progress(1).pause(0);
   
     }
   
   
   
   
     function tick() {
      var currY = p.position.getY();
      var currX = p.position.getX();
   
      if(hasThrown) {
   
       if(currY < 0) highEnough = true;
   
         // Has the ball been thrown high enough
         if(highEnough) {
   
           // Is it falling?
          if(lastY < currY && force.getLength() > 15) {
   
            // Has it hit the basket
            if(currY < 15 && currY > -15) {
              hasThrown = false;

              // Was it on target? - Adjusted for perspective
              if(currX > basketWidth*0.1 && currX < basketWidth*1.1 || currX < -basketWidth*0.1 && currX > -basketWidth*1.1) {
                // Instead of bouncing, let the ball continue its path
                p.velocity.setLength(p.velocity.getLength() * 0.8);
                p.velocity.setX(p.velocity.getX() * 0.8);
              } else if(currX <= basketWidth*1.1 && currX >= -basketWidth*1.1 && gameActive) {
                // Yes - Score!
                score += 2;
                hits += 1;
                
                // Show goal animation
                showGoalAnimation();
                
                // Special animation for 7 points
                if (score === 7) {
                  TweenMax.killTweensOf("#basket");
                  
                  TweenMax.to("#basket", 0.5, {
                    scale: 1.2,
                    rotation: 10,
                    ease: Elastic.easeOut
                  });
                  
                  TweenMax.to("#basket", 0.5, {
                    scale: 1,
                    rotation: 0,
                    ease: Power1.easeIn,
                    delay: 0.5
                  });
                }
               
                // Three pointer?
                if(force.getX() > 2 || force.getX() < -2) {
                 score += 1;
                }
                
                // Update score display
                document.getElementById("score").innerHTML = "Score: " + score;
                document.getElementById("hits").innerHTML = "Hits: " + hits;
                
                TweenMax.to("#net", 1, {scaleY:1.1, transformOrigin:"50% 0", ease:Elastic.easeOut});
                TweenMax.to("#net", 0.3, {scale:1, transformOrigin:"50% 0", ease:Power2.easeInOut, delay:0.6});
              }
            }
          }
        }
      }
   
      p.update();
      TweenMax.set(ball, {
       x:p.position.getX(),
       y:currY,
       rotation:rot
      });
   
   
      lastY = currY;
   
     };
   
   
   
     
   
     function grabBall(e) {
      
      e.preventDefault();
   
      // Create a new basketball
      var newBall = document.createElement("div");
      newBall.className = "basketball";
      
      // Copy the SVG content from the original ball
      newBall.innerHTML = ball.innerHTML;
      
      // Position the new ball at click position
      document.querySelector(".stage").appendChild(newBall);
      
      // Style the new ball
      TweenMax.set(newBall, {
          position: "absolute",
          width: ballRadius + "px",
          height: ballRadius + "px",
          x: getMouse(e).x - ballRadius/2,
          y: getMouse(e).y - ballRadius/2,
          scale: 0.5,  // Start smaller
          autoAlpha: 0  // Start transparent
      });
      
      // Animate the new ball appearing
      TweenMax.to(newBall, 0.3, {
          scale: 1,
          autoAlpha: 1,
          ease: Back.easeOut,
          onComplete: function() {
              // Fade out and remove after a short time
              TweenMax.to(newBall, 0.5, {
                  y: "+=100",
                  autoAlpha: 0,
                  ease: Power1.easeIn,
                  delay: 0.5,
                  onComplete: function() {
                      newBall.parentNode.removeChild(newBall);
                  }
              });
          }
      });

      // Original ball handling code
      p = Particle.create(
          ball.getBoundingClientRect().left + ballRadius/2,
          ball.getBoundingClientRect().top + ballRadius/2,
          0,
          0,
          0.2
      );
      force = Vector.create(0,0);
      start = Vector.create(getMouse(e).x, getMouse(e).y-offsetY);

      document.addEventListener("mousemove", moveBall);
      document.addEventListener("touchmove", moveBall);
     };
   
   
     
   
     function moveBall(e) {
      
      e.preventDefault();
   
      getSpeed(e);
   
      //  Update the ball's position
      TweenMax.set(ball, {x:p.position.getX(), y:p.position.getY()});
   
     };
   
     
     
   
     function releaseBall() {
   
      // Stop tracking the mousedown/touchdown
      ball.removeEventListener("mousedown", grabBall);
      ball.removeEventListener("touchstart", grabBall);
      // Stop tracking the mousemove
      document.removeEventListener("mousemove", moveBall);
      document.removeEventListener("touchmove", moveBall);
      // Reset the mouse tracking defaults
      timestamp = null;
      lastMouse = null;
   
      hasThrown = true;
   
      shots += 1;
   
      scale.play(0);
   
      // Limit how hard the ball can be thrown
      if(force.getLength() > 30) force.setLength(30);
      p.velocity = force;
      p.gravity = Vector.create(0, 0.8);
      
      if(force.getX() > 0) {
       rot = "-=4";
      } else {
       rot = "+=4";
      }
   
      // Start physics ticker
      TweenMax.ticker.addEventListener("tick", tick);
   
      // Reset after 3 seconds or when the ball goes out of bounds
      TweenMax.delayedCall(3, reset);
   
     };
   
   
   
     
     function reset() {
   
      // Stop the physics ticker
      TweenMax.ticker.removeEventListener("tick", tick);
   
      // Reset physics variables
      p.gravity = Vector.create(0, 0);
      hasThrown = false;
      highEnough = false;
   
      // Reset ball position and rotation with a fixed scale
      TweenMax.to(ball, 1, {
        x: 0,
        y: offsetY,
        scale: 1,  // Set to 1 instead of ratio to maintain original size
        rotation: 0,
        ease: Power3.easeOut,
        onComplete: function() {
          // Re-enable ball interaction after reset
          ball.addEventListener("mousedown", grabBall);
          ball.addEventListener("touchstart", grabBall);
        }
      });
   
      // Update score display
      updateScore();
   
     };
   
   
   
   
     function getMouse(e) {
   
      return {
       x:e.clientX || e.targetTouches[0].clientX,
       y:e.clientY || e.targetTouches[0].clientY
      };
   
     };
   
   
   
     
     function getSpeed(e) {
   
      e.preventDefault();
   
      if(timestamp === null) {
       timestamp = Date.now();
       lastMouse = getMouse(e);
       return;
      };
   
      var now = Date.now(),
      currMouse = getMouse(e),
      dx = currMouse.x - lastMouse.x,
      dy = currMouse.y - lastMouse.y;
      
      // Let's make the angle less steep
      dy *= 2;
      dx /= 2;
   
      timestamp = now;
      lastMouse = currMouse;
   
      force = Vector.create(dx, dy);
      p.position.setX(getMouse(e).x - start.getX());
      p.position.setY(getMouse(e).y - start.getY());
   
     };
   
   
   
     
     function updateScore() {
      accuracy = hits / shots;
   
      document.getElementById("shots").innerHTML = "Shots: " + shots;
      document.getElementById("hits").innerHTML = "Score: " + score;
      document.getElementById("accuracy").innerHTML = "Accuracy: " + Math.round(accuracy * 100) + "%"
     }
   
     function showGoalAnimation() {
       // Kill any existing animations
       TweenMax.killTweensOf("#goalText");
       
       // Reset goal text
       TweenMax.set("#goalText", {
         clearProps: "all",
         fontSize: "0px",
         opacity: 0,
         scale: 1,
         rotation: 0
       });
       
       // Show goal text
       TweenMax.to("#goalText", 0.5, {
         fontSize: "150px",
         opacity: 1,
         ease: Back.easeOut
       });
       
       // Hide goal text
       TweenMax.to("#goalText", 0.5, {
         fontSize: "0px",
         opacity: 0,
         ease: Power1.easeIn,
         delay: 1
       });
     }
    };
   });
   