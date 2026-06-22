// Dot movement animations
// Dice roll animations
// Teleport animations
// Home path movement


// Load sound files
// https://mixkit.co/free-sound-effects/notification/
const sounds = {
    start: new Audio('sounds/mixkit-long-pop-2358.wav'),
    collision: new Audio('sounds/mixkit-wrong-answer-fail-notification-946.wav'),
    home: new Audio('sounds/mixkit-gaming-lock-2848.wav'),
    win: new Audio('sounds/mixkit-happy-bells-notification-937.wav'),
    turn: new Audio('sounds/mixkit-message-pop-alert-2354.mp3')
};

// Function to play sound
function playSound(sound) {
    if (sounds[sound]) {
        sounds[sound].play();
    }
}

// Animate dice roll when clicked
function handleDiceClick() {
    console.debug("die clicked");
    currentBoard.gameStarted = true;
    fadeOut(playerControls.container);
    // Prevent multiple rolls in one turn
    if (currentBoard.diceRolled || currentBoard.animating) {updateGameInfo("Please wait for the current move to complete!"); return;}
    const player = currentBoard.players[currentBoard.currentPlayerIndex];
    const playerCanvas = player.display;    
    const diceElement = document.getElementById('dice-container');
    currentBoard.animating = true;
    const isAutoMover = player.autoMove;
    const allAutoMovers = currentBoard.players.every(player => player.autoMove);
    // Get player color for highlighting dice
    const playerColor = player.color;
    diceElement.style.boxShadow = `0 0 15px ${playerColor}`;
    diceElement.style.fontSize = 9 * baseUnit + 'px';

    // Power roll
    const allDotsInStartingArea = playerCanvas.dots.every(dot => dot.inStartingArea);
    const allDotsInStartingAreaOrAtHome = playerCanvas.dots.every(dot => dot.reachedHome || dot.inStartingArea);

    // Start shaking animation
    let rotations = 0;
    let lastDice = 1;
    const rollInterval = setInterval(() => {
        // Show random dice face during animation
        lastDice = Math.floor(Math.random() * currentBoard.dieSize) + 1;
        diceElement.textContent = getDiceFace(lastDice);
        
        // Apply shake effect
        const randomX = (Math.random() - 0.5) * 2 * baseUnit;
        const randomY = (Math.random() - 0.5) * 2 * baseUnit;
        const randomRotate = (Math.random() - 0.5) * 60;
        diceElement.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg)`;
        
        rotations++;
        // Stop after few rotations (about 20 for about 1 second)
        if (rotations >= (allAutoMovers ? fastSpeedFactor : 1)*10) {
            clearInterval(rollInterval);
            
            // Final result
            const rollResult = myDice(1); // + allDotsInStartingAreaOrAtHome + allDotsInStartingArea);
            player.diceHistory[rollResult-1] += 1;
            diceElement.textContent = getDiceFace(rollResult);
            diceElement.style.transform = 'scale(1.2)';
            console.debug("roll result: "+rollResult);
            
            // Store roll result and update game state
            currentBoard.players[currentBoard.currentPlayerIndex].die = rollResult;
            currentBoard.diceRolled = true;
            currentBoard.animating = false;

            // Get moveable dots for current player
            moveableDots = getMoveableDots(player, rollResult)
            // auto move if all possible moves are the same, or if the player is an auto mover
            // moving out of starting area is considered the same move
            autoMoveDot = isAutoMover || (2 > moveableDots.length)
                || moveableDots.every(dot => (dot.inHomePath === moveableDots[0].inHomePath) && (dot.inHomePath ? (dot.stepsToHome === moveableDots[0].stepsToHome) : (dot.index === moveableDots[0].index)))
            
            // Reset dice appearance after showing result
            setTimeout(() => {
                diceElement.style.transform = 'scale(1)';
                if (autoMoveDot) {
                    autoMove();
                } else {
                    animateMoveableDots(player, rollResult);
                }
            }, (allAutoMovers ? fastSpeedFactor : 1)*300);
        }
    }, 50);
}


// Animate a sequence of individual steps based on dice roll
function moveMultipleSteps(player, dotIndex, steps, direction, onComplete) {
    console.debug("moveMultipleSteps")
    console.debug("moving "+steps+" steps in direction "+direction);
    const playerCanvas = player.display;
    const dot = playerCanvas.dots[dotIndex];
    let stepsRemaining = steps;
    let currentIndex = dot.index;
    const allAutoMovers = currentBoard.players.every(player => player.autoMove);
    
    // Function to move a single step
    function moveNextStep() {
        if (stepsRemaining <= 0) {
            // All steps completed
            currentBoard.animating = false;
            if (onComplete) {
                onComplete();
            }
            return;
        }
        
        // Calculate next step's target index
        const targetIndex = (currentIndex + direction + pathPoints.length) % pathPoints.length;
        // Animate the single step
        animateSingleStep(player, dotIndex, targetIndex, () => {
            // After step completes, prepare for next step
            currentIndex = targetIndex;
            dot.index = targetIndex;
            stepsRemaining--;
            
            // Show remaining steps in game info
            if (stepsRemaining > 0) {
                updateGameInfo(`${player.name} moving: ${stepsRemaining} steps remaining...`);
                // Delay between steps
                setTimeout(moveNextStep, ((allAutoMovers || direction<0) ? fastSpeedFactor/5 : 1)*80);
            } else {
                // All steps completed
                updateGameInfo(`${player.name}'s move completed!`);
                moveNextStep();
            }
        });
    }
    
    // Start the sequence
    currentBoard.animating = true;
    updateGameInfo(`${player.name} moving ${steps} steps...`);
    moveNextStep();
}

// Move dot along home path
function moveAlongHomePath(player, dotIndex, steps, onComplete) {
    console.debug("moveAlongHomePath");
    const playerCanvas = player.display;
    const dot = playerCanvas.dots[dotIndex];
    const allAutoMovers = currentBoard.players.every(player => player.autoMove);
    dot.moving = true;
    currentBoard.animating = true;
    
    // Get current position in home path
    const currentStep = dot.homePathStep || 0;
    const newStep = currentStep + steps;
    
    // Check if this would exceed the home (currentBoard.homeLayerLength steps)
    if (newStep > currentBoard.homeLayerLength) {
        error("Invalid move along home path !! should not get to this line of code");
    }
    
    // Get the pivot index and point
    const pivotIndex = player.outputIndex;
    const pivotPoint = pathPoints[pivotIndex];
    const boardCenter = { x: bgCanvas.width / 2, y: bgCanvas.height / 2 };
    const canvasPivot = pathToCanvas(pivotPoint);
    
    // Calculate new position (newStep/(currentBoard.homeLayerLength+1) of the way to center)
    const ratio = newStep / (currentBoard.homeLayerLength+1);
    const newPosition = {
        x: canvasPivot.x + (boardCenter.x - canvasPivot.x) * ratio,
        y: canvasPivot.y + (boardCenter.y - canvasPivot.y) * ratio
    };
    
    // Animate the movement
    const startPosition = dot.homePathPosition;
    const duration = (allAutoMovers ? fastSpeedFactor : 1)*200 * steps; // Fixed duration for a single step
    const startTime = performance.now();
    
    updateGameInfo(`${player.name}'s dot is moving along home path...`);

    function animateStep(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smoother movement
        // const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
        
        // Simple linear interpolation between points
        dot.homePathPosition = {
            x: startPosition.x + (newPosition.x - startPosition.x) * (progress - Math.sin(progress*steps*2*Math.PI)/(steps*2*Math.PI)),
            y: startPosition.y + (newPosition.y - startPosition.y) * (progress - Math.sin(progress*steps*2*Math.PI)/(steps*2*Math.PI))
        };
        
        drawPlayerDots(player);
        
        if (progress < 1) {
            requestAnimationFrame(animateStep);
        } else {
            dot.moving = false;
            dot.homePathStep = newStep;
            dot.stepsToHome = currentBoard.homeLayerLength - newStep;
            dot.inHomePath = true;
            currentBoard.animating = false;

            if (newStep === currentBoard.homeLayerLength) {
                dot.reachedHome = true;
                currentBoard.extraTurn = true;
                updateGameInfo(`${player.name}'s dot reached home!`);
                playSound('home');
            }
            if (onComplete) {onComplete();};
        }
    }

    requestAnimationFrame(animateStep);
}

// Animate teleporting from starting area to path entry point
function animateDotTeleport(player, dotIndex, targetPosition, OnComplete) {
    console.debug("animateDotTeleport");
    const playerCanvas = player.display;
    const dot = playerCanvas.dots[dotIndex];
    dot.moving = true;
    currentBoard.animating = true;
    const allAutoMovers = currentBoard.players.every(player => player.autoMove);
    
    // Get starting position
    const startPosition = {
        x: dot.startPosition.x,
        y: dot.startPosition.y
    };
    
    const duration = (allAutoMovers ? fastSpeedFactor : 1)*500; // Fixed duration for teleport
    const startTime = performance.now();
    
    updateGameInfo(`${player.name}'s dot is ${(dot.inStartingArea ? "exiting" : "entering")} the board!`);
    
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
        
        drawPlayerDots(player);
        
        if (progress < 1) {
            requestAnimationFrame(animateStep);
        } else {
            dot.moving = false;
            dot.interpolation = undefined;
            currentBoard.animating = false;
            if (OnComplete) {
                OnComplete();
            }
        }
    }
    
    requestAnimationFrame(animateStep);
}


// Animate a single step with callback when complete
function animateSingleStep(player, dotIndex, targetIndex, onComplete) {
    console.debug("animateSingleStep");
    const playerCanvas = player.display;
    const dot = playerCanvas.dots[dotIndex];
    dot.moving = true;
    dot.targetIndex = targetIndex;
    const startIndex = dot.index;
    const allAutoMovers = currentBoard.players.every(player => player.autoMove);
    
    const goingBackwards = (targetIndex - startIndex + pathPoints.length) % pathPoints.length > pathPoints.length / 2;
    // Single step animation is always a distance of 1
    const duration = ((allAutoMovers || goingBackwards) ? fastSpeedFactor : 1)*200; // Fixed duration for a single step
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
        
        drawPlayerDots(player);
        
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
function moveToHomePathEntry(player, dotIndex, remainingSteps, onComplete) {
    console.debug("moveToHomePathEntry");
    const playerCanvas = player.display;
    const dot = playerCanvas.dots[dotIndex];
    dot.moving = true;
    currentBoard.animating = true;
    
    // Get the pivot index for this player
    const pivotIndex = player.outputIndex;
    
    
    // Calculate steps to pivot
    let stepsToMove;
    if (dot.index <= pivotIndex) {
        stepsToMove = pivotIndex - dot.index;
    } else {
        stepsToMove = (pathPoints.length - dot.index) + pivotIndex;
    }
    
    // Animate movement to pivot
    moveMultipleSteps(player, dotIndex, stepsToMove, 1, () => {
        // Once at pivot, set up for home path
        if (0==remainingSteps) {
            drawPlayerDots(player);
            dot.moving = false;
            currentBoard.animating = false;
            if (onComplete) {onComplete();};
            return;
        }
        dot.inHomePath = true;
        dot.homePathStep = 0;
        dot.stepsToHome = currentBoard.homeLayerLength; // Total steps to reach home
        
        // Calculate home path position
        const pivotPoint = pathPoints[pivotIndex];
        dot.homePathPosition = pathToCanvas(pivotPoint);
        
        // Move along home path by remaining steps
        moveAlongHomePath(player, dotIndex, remainingSteps, onComplete);
    });
}


function animateMoveableDots(player, moveAmount, animateAll = false) {
    console.debug("animateMoveableDots");
    let whoCanMove = Array.from({length: player.numBosons}, (_, i) => true);
    let moveableDots = player.display.dots;
    if (!animateAll) {
        whoCanMove = checkWhoCanMove(player, moveAmount);
        moveableDots = player.display.dots.filter((_, i) => whoCanMove[i]);
    };
    moveableDots.forEach(dot => {
        dot.moving = true;
    });
    let counter = 0;
    const interval = 100;
    const moveableDotsInterval = setInterval(() => {
        counter++;
        // Apply shake effect
        const randomX = whoCanMove.map((canMove, index) => canMove * Math.sin(counter*interval/1000 *                2 * Math.PI * (0.95+0.1*index/moveableDots.length)) * baseUnit * Math.cos((1+2*(0.5+index)/moveableDots.length) * Math.PI/8) * 0.3);
        const randomY = whoCanMove.map((canMove, index) => canMove * Math.sin(counter*interval/1000 * (Math.sqrt(5)+1) * Math.PI * (0.95+0.1*index/moveableDots.length)) * baseUnit * Math.sin((1+2*(0.5+index)/moveableDots.length) * Math.PI/8) * 0.3);
        drawPlayerDots(player, randomX, randomY);
        if (currentBoard.animating) {
            clearInterval(moveableDotsInterval);
        }
    }, interval);
}


function sendDotToStartingArea(player, i, onComplete) {
    const playerCanvas = player.display;
    const dot = playerCanvas.dots[i];
    // dot.inStartingArea = true;
    let moveAmount = dot.index - player.inputIndex;
    if (moveAmount < 0) {
        moveAmount += pathPoints.length;
    };
    moveMultipleSteps(player, i, moveAmount, -1, ()=>{
        dot.inStartingArea = true;
        dot.index = dot.startIndex;
        dot.targetIndex = dot.startIndex;
        animateDotTeleport(player, i, dot.startPosition, onComplete);
    });
}

