// Dot movement animations
// Dice roll animations
// Teleport animations
// Home path movement


// Animate teleporting from starting area to path entry point
function animateDotTeleport(playerCanvas, dotIndex, targetPosition, OnComplete) {
    const dot = playerCanvas.dots[dotIndex];
    dot.moving = true;
    gameState.animating = true;
    const isAutoMover = gameState.autoMover[gameState.currentPlayerIndex];
    
    // Get starting position
    const startPosition = {
        x: dot.startPositions[dot.startingPosition].x,
        y: dot.startPositions[dot.startingPosition].y
    };
    
    const duration = (isAutoMover ? fastSpeedFactor : 1)*500; // Fixed duration for teleport
    const startTime = performance.now();
    
    (OnComplete) && updateGameInfo(`${playerCanvas.player.name}'s dot is entering the board!`);
    
    function animateStep(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smoother movement
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
        
        // Simple linear interpolation between points
        const currentX = startPosition.x + (targetPosition.x - startPosition.x) * easedProgress;
        const currentY = startPosition.y + (targetPosition.y - startPosition.y) * easedProgress;
        
        dot.interpolation = {
            x: +(currentX - bgCanvas.width / 2) / (bgCanvas.width / 8),
            y: -(currentY - bgCanvas.height / 2) / (bgCanvas.height / 6)
        };
        
        drawPlayerDots(playerCanvas);
        
        if (progress < 1) {
            requestAnimationFrame(animateStep);
        } else {
            dot.moving = false;
            dot.interpolation = undefined;
            gameState.animating = false;
            if (OnComplete) {
                OnComplete();
            } else {
                nextTurn();
            }
        }
    }
    
    requestAnimationFrame(animateStep);
}

// Animate a sequence of individual steps based on dice roll
function moveMultipleSteps(playerCanvas, dotIndex, steps, direction, onComplete) {
    const dot = playerCanvas.dots[dotIndex];
    let stepsRemaining = steps;
    let currentIndex = dot.index;
    const isAutoMover = gameState.autoMover[gameState.currentPlayerIndex];
    
    // Function to move a single step
    function moveNextStep() {
        if (stepsRemaining <= 0) {
            // All steps completed
            gameState.animating = false;
            if (onComplete) {
                onComplete();
            } else {
                nextTurn();
            }
            return;
        }
        
        // Calculate next step's target index
        const targetIndex = (currentIndex + direction + pathPoints.length) % pathPoints.length;
        // Animate the single step
        animateSingleStep(playerCanvas, dotIndex, targetIndex, () => {
            // After step completes, prepare for next step
            currentIndex = targetIndex;
            dot.index = targetIndex;
            stepsRemaining--;
            
            // Show remaining steps in game info
            if (stepsRemaining > 0) {
                updateGameInfo(`${playerCanvas.player.name} moving: ${stepsRemaining} steps remaining...`);
                // Delay between steps
                setTimeout(moveNextStep, ((isAutoMover || direction<0) ? fastSpeedFactor : 1)*80);
            } else {
                // All steps completed
                updateGameInfo(`${playerCanvas.player.name}'s move completed!`);
                moveNextStep();
            }
        });
    }
    
    // Start the sequence
    gameState.animating = true;
    updateGameInfo(`${playerCanvas.player.name} moving ${steps} steps...`);
    moveNextStep();
}

// Animate a single step with callback when complete
function animateSingleStep(playerCanvas, dotIndex, targetIndex, onComplete) {
    const dot = playerCanvas.dots[dotIndex];
    dot.moving = true;
    dot.targetIndex = targetIndex;
    const isAutoMover = gameState.autoMover[gameState.currentPlayerIndex];
    
    const startIndex = dot.index;
    
    // Single step animation is always a distance of 1
    const duration = (isAutoMover ? fastSpeedFactor : 1)*200; // Fixed duration for a single step
    const startTime = performance.now();
    
    function animateStep(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smoother movement
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
        
        // Calculate current position along the path (just between two points)
        const currentPoint = pathPoints[startIndex];
        const nextPoint = pathPoints[targetIndex];
        
        // Check if points exist before interpolating
        if (currentPoint && nextPoint) {
            // Simple linear interpolation between points
            dot.interpolation = {
                x: currentPoint.x + (nextPoint.x - currentPoint.x) * easedProgress,
                y: currentPoint.y + (nextPoint.y - currentPoint.y) * easedProgress
            };
        } else {
            // Fallback if points don't exist
            dot.interpolation = pathPoints[dot.index];
            console.warn("Animation points not found, using fallback");
        }
        
        drawPlayerDots(playerCanvas);
        
        if (progress < 1) {
            requestAnimationFrame(animateStep);
        } else {
            dot.index = targetIndex;
            dot.moving = false;
            dot.interpolation = undefined;
            
            // Call the completion callback
            if (onComplete) onComplete();
        }
    }
    
    requestAnimationFrame(animateStep);
}

// Move dot to home path entry and set up remaining steps
function moveToHomePathEntry(playerCanvas, dotIndex, remainingSteps) {
    const dot = playerCanvas.dots[dotIndex];
    dot.moving = true;
    gameState.animating = true;
    
    // Get the pivot index for this player
    const playerIndex = gameState.currentPlayerIndex;
    const pivotIndex = (playerIndex * (sideLength*2+1));
    
    
    // Calculate steps to pivot
    let stepsToMove;
    if (dot.index < pivotIndex) {
        stepsToMove = pivotIndex - dot.index;
    } else {
        stepsToMove = (pathPoints.length - dot.index) + pivotIndex;
    }
    
    // Animate movement to pivot
    moveMultipleSteps(playerCanvas, dotIndex, stepsToMove, 1, () => {
        // Once at pivot, set up for home path
        if (0==remainingSteps) {
            drawPlayerDots(playerCanvas);
            dot.moving = false;
            gameState.animating = false;
            nextTurn();
            return;
        }
        dot.inHomePath = true;
        dot.homePathStep = 0;
        dot.stepsToHome = gameState.pathToHome; // Total steps to reach home
        
        // Calculate home path position
        const pivotPoint = pathPoints[pivotIndex];
        const boardCenter = { x: bgCanvas.width / 2, y: bgCanvas.height / 2 };
        dot.homePathPosition = pathToCanvas(pivotPoint);
        
        // Move along home path by remaining steps
        moveAlongHomePath(playerCanvas, dotIndex, remainingSteps);
    });
}

// Move dot along home path
function moveAlongHomePath(playerCanvas, dotIndex, steps) {
    const dot = playerCanvas.dots[dotIndex];
    dot.moving = true;
    gameState.animating = true;
    
    // Get current position in home path
    const currentStep = dot.homePathStep || 0;
    const newStep = currentStep + steps;
    
    // Check if this would exceed the home (gameState.pathToHome steps)
    if (newStep > gameState.pathToHome) {
        updateGameInfo(`Cannot move beyond home! Try another dot.`);
        dot.moving = false;
        gameState.animating = false;
        return;
    }
    
    // Get the pivot index and point
    const playerIndex = gameState.currentPlayerIndex;
    const pivotIndex = (playerIndex * (sideLength * 2 + 1));
    const pivotPoint = pathPoints[pivotIndex];
    const boardCenter = { x: bgCanvas.width / 2, y: bgCanvas.height / 2 };
    const canvasPivot = pathToCanvas(pivotPoint);
    
    // Calculate new position (newStep/(gameState.pathToHome+1) of the way to center)
    const ratio = newStep / (gameState.pathToHome+1);
    const newPosition = {
        x: canvasPivot.x + (boardCenter.x - canvasPivot.x) * ratio,
        y: canvasPivot.y + (boardCenter.y - canvasPivot.y) * ratio
    };
    
    // Animate the movement
    const startPosition = dot.homePathPosition;
    const duration = 200; // Fixed duration for a single step
    const startTime = performance.now();
    
    updateGameInfo(`${playerCanvas.player.name}'s dot is moving along home path...`);
    
    function animateStep(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smoother movement
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
        
        // Simple linear interpolation between points
        dot.homePathPosition = {
            x: startPosition.x + (newPosition.x - startPosition.x) * easedProgress,
            y: startPosition.y + (newPosition.y - startPosition.y) * easedProgress
        };
        
        drawPlayerDots(playerCanvas);
        
        if (progress < 1) {
            requestAnimationFrame(animateStep);
        } else {
            dot.moving = false;
            dot.homePathStep = newStep;
            dot.stepsToHome = gameState.pathToHome - newStep;
            dot.inHomePath = true;
            gameState.animating = false;

            if (newStep === gameState.pathToHome) {
                dot.reachedHome = true;
            }
            if (checkWinCondition(playerCanvas)) {
                return;
            } else {
                nextTurn();
            }
        }
    }

    requestAnimationFrame(animateStep);
}

// Move dot to home (final position)
function moveToHome(playerCanvas, dotIndex) {
    const dot = playerCanvas.dots[dotIndex];
    dot.moving = true;
    gameState.animating = true;
    
    // Get the board center
    const boardCenter = { x: bgCanvas.width / 2, y: bgCanvas.height / 2 };
    
    // Animate the movement to home
    const startPosition = dot.homePathPosition;
    const duration = 500; // Fixed duration for reaching home
    const startTime = performance.now();
    
    updateGameInfo(`${playerCanvas.player.name}'s dot reached home!`);
    
    function animateStep(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smoother movement
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
        
        // Simple linear interpolation between points
        dot.homePathPosition = {
            x: startPosition.x + (boardCenter.x - startPosition.x) * easedProgress,
            y: startPosition.y + (boardCenter.y - startPosition.y) * easedProgress
        };
        
        drawPlayerDots(playerCanvas);
        
        if (progress < 1) {
            requestAnimationFrame(animateStep);
        } else {
            dot.moving = false;
            dot.reachedHome = true;
            dot.homePathStep = 5;
            dot.stepsToHome = 0;
            gameState.animating = false;
            
            // Check if all dots reached home
            checkWinCondition(playerCanvas);
            nextTurn();
        }
    }
    
    requestAnimationFrame(animateStep);
}

// Animate dice roll when clicked
function handleDiceClick() {
    // Prevent multiple rolls in one turn
    if (gameState.diceRolled || gameState.animating) return;
    fadeOut(gameState.playerControls.container);
    const diceElement = document.getElementById('dice-container');
    gameState.animating = true;
    const isAutoMover = gameState.autoMover[gameState.currentPlayerIndex];
    currentPlayerCanvas = playerCanvases[gameState.currentPlayerIndex];
    // Get player color for highlighting dice
    const playerColor = players[gameState.currentPlayerIndex].color;
    diceElement.style.boxShadow = `0 0 15px ${playerColor}`;
    diceElement.style.fontSize = `${baseUnit * 9}px`;

    // Power roll
    const allDotsInStartingArea = currentPlayerCanvas.dots.every(dot => dot.inStartingArea);
    const allDotsInStartingAreaOrAtHome = currentPlayerCanvas.dots.every(dot => dot.reachedHome || dot.inStartingArea);

    // Start shaking animation
    let rotations = 0;
    let lastDice = 1;
    const rollInterval = setInterval(() => {
        // Show random dice face during animation
        lastDice = Math.floor(Math.random() * gameState.dieFaces) + 1;
        diceElement.textContent = getDiceFace(lastDice);
        
        // Apply shake effect
        const randomX = (Math.random() - 0.5) * 2 * baseUnit;
        const randomY = (Math.random() - 0.5) * 2 * baseUnit;
        const randomRotate = (Math.random() - 0.5) * 60;
        diceElement.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg)`;
        
        rotations++;
        // Stop after few rotations (about 20 for about 1 second)
        if (rotations >= (isAutoMover ? fastSpeedFactor : 1)*10) {
            clearInterval(rollInterval);
            
            // Final result
            const rollResult = myMaxRandom(1 + allDotsInStartingAreaOrAtHome + allDotsInStartingArea);
            diceElement.textContent = getDiceFace(rollResult);
            diceElement.style.transform = 'scale(1.2)';
            
            // Store roll result and update game state
            gameState.lastRoll = rollResult;
            gameState.diceRolled = true;
            gameState.animating = false;

            // Get moveable dots for current player
            moveableDots = getMoveableDots(currentPlayerCanvas, rollResult)
            autoMoveDot = (2 > moveableDots.length)
                || moveableDots.every(dot => dot.index === moveableDots[0].index)
                || isAutoMover
            
            // Reset dice appearance after showing result
            setTimeout(() => {
                // diceElement.style.top = `${baseUnit * 6}px`;
                // diceElement.style.left = `${baseUnit * 6}px`;
                diceElement.style.transform = 'scale(1)';
                if (autoMoveDot) {
                    autoMove();
                } else {
                    animateMoveableDots(currentPlayerCanvas, rollResult);
                }
            }, (isAutoMover ? fastSpeedFactor : 1)*500);
        }
    }, 50);
}


function animateMoveableDots(currentPlayerCanvas, moveAmount) {
    moveableDots = getMoveableDots(currentPlayerCanvas, moveAmount);
    let counter = 0;
    const interval = 100;
    moveableDotsInterval = setInterval(() => {
        counter++;
        // Apply shake effect
        moveableDots.forEach(dot => {
            dot.moving = true;
        });
        const whoCanMove = Array(...currentPlayerCanvas.dots.map(dot => moveableDots.includes(dot)));
        const randomX = whoCanMove.map((canMove, index) => canMove * Math.sin(counter*interval/1000 *                2 * Math.PI * (0.95+0.1*index/moveableDots.length)) * baseUnit * Math.cos((1+2*(0.5+index)/moveableDots.length) * Math.PI/8) * 0.3);
        const randomY = whoCanMove.map((canMove, index) => canMove * Math.sin(counter*interval/1000 * (Math.sqrt(5)+1) * Math.PI * (0.95+0.1*index/moveableDots.length)) * baseUnit * Math.sin((1+2*(0.5+index)/moveableDots.length) * Math.PI/8) * 0.3);
        drawPlayerDots(currentPlayerCanvas, randomX, randomY);
        if (gameState.animating) {
            clearInterval(moveableDotsInterval);
        }
    }, interval);
}


function sendDotToStartingArea(playerCanvas, i) {
    const dot = playerCanvas.dots[i];
    // dot.inStartingArea = true;
    let moveAmount = dot.index - dot.pathEntryIndex;
    if (moveAmount < 0) {
        moveAmount += pathPoints.length;
    };
    moveMultipleSteps(playerCanvas, i, moveAmount, -1, ()=>{
        dot.inStartingArea = true;
        dot.index = -1;
        dot.targetIndex = -1;
        animateDotTeleport(playerCanvas, i, dot.startPositions[dot.startingPosition], ()=>nextTurn());
    });
}

