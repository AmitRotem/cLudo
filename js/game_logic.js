// Game state management
// Player management (turns, selection)
// Path calculation and position logic
// Game rules (movement, home entry, etc)
// Win condition checking

// TODO; in 2 player mode, the blue does a 2nd full rotation before entering home path!
// TODO; make dice less jummpy; maybe shift to closest corner/side after roll ?
// TODO; preper to quantize the game - add `state` and `pattern` to playerCanvas, add `measurement` and `project` functions, redestribute pattern in starting area if possible, finally add `selfInteraction` function (game start classical, then quantum effects comes in via `selfInteraction`, like in a HOM experiment)

function myMaxRandom(numberOfDices = 1) {
    numberOfDices > 1 && console.log(`Rolling ${numberOfDices} dice`);
    const rolls = Array.from({ length: numberOfDices }, () => Math.floor(Math.random() * gameState.dieFaces) + 1);
    // const userNumber = parseInt(prompt("Enter a number:"));
    // return userNumber;
    return Math.max(...rolls);
}

function moveDotOutOfStartingArea(currentPlayerCanvas, i, moveAmount) {
    // Can only move out with a gameState.dieFaces
    if (moveAmount === gameState.dieFaces) {
        const dot = currentPlayerCanvas.dots[i];
        // Move to the starting position on the path
        dot.inStartingArea = false;
        dot.index = dot.pathEntryIndex;
        dot.targetIndex = dot.pathEntryIndex;
        
        // Animate the movement
        animateDotTeleport(currentPlayerCanvas, i, pathToCanvas(pathPoints[dot.pathEntryIndex]));
        return;
    } else {
        updateGameInfo(`Need to roll a ${gameState.dieFaces} to move out! Try another dot.`);
        return;
    }
}

function moveDotAlongHomePath(currentPlayerCanvas, i, moveAmount) {
    const dot = currentPlayerCanvas.dots[i];
    // Check if the roll matches exactly what's needed to reach home
    if (moveAmount === dot.stepsToHome) {
        // Move to home!
        moveToHome(currentPlayerCanvas, i);
        return;
    } else if (moveAmount < dot.stepsToHome) {
        // Move along home path
        moveAlongHomePath(currentPlayerCanvas, i, moveAmount);
        return;
    } else {
        updateGameInfo(`Need exactly ${dot.stepsToHome} to reach home! Try another dot.`);
        return;
    }
}

function moveDotAlongMainPath(currentPlayerCanvas, i, moveAmount) {
    const dot = currentPlayerCanvas.dots[i];
    // Get the current path position
    const currentIndex = dot.index;
    // Calculate target position
    let targetIndex = (currentIndex + moveAmount) % pathPoints.length;
    // Check if dot will reach or pass its pivot point
    const playerIndex = gameState.currentPlayerIndex;
    const pivotIndex = (playerIndex * (sideLength * 2 + 1));
    const featureIndex = Array.from({ length: moveAmount + 1 }, (_, i) => (currentIndex + i) % pathPoints.length);
    const willPassPivot = featureIndex.includes(pivotIndex);

    if (willPassPivot) {
        // Determine remaining steps after reaching pivot
        const stepsAfterPivot = moveAmount - featureIndex.findIndex(index => index === pivotIndex);

        // If remaining steps <= gameState.pathToHome (length of home path), move to home path
        if (stepsAfterPivot <= gameState.pathToHome) {
            // First move to pivot
            moveToHomePathEntry(currentPlayerCanvas, i, stepsAfterPivot);
            return;
        }
    }

    // Normal path movement
    moveMultipleSteps(currentPlayerCanvas, i, moveAmount, 1, () => {
        // Check if dot landed on another dot
        checkForCollision(currentPlayerCanvas, i);
        nextTurn();
    });
    return;
}

function checkForCollision(currentPlayerCanvas, i) {
    const dot = currentPlayerCanvas.dots[i];
    // safeIndex, that stars
    if (gameState.safeIndex.includes(dot.index)) {
        return false;
    }
    // Check if the dot landed on another dot
    const otherPlayerCanvases = playerCanvases.filter(pc => pc !== currentPlayerCanvas);
    let collision = false;
    for (const otherCanvas of otherPlayerCanvases) {
        const otherDots = otherCanvas.dots;
        for (j = 0; j < otherDots.length; j++) {
            if (otherDots[j].reachedHome || otherDots[j].inHomePath || otherDots[j].inStartingArea) {
                continue;
            }
            if (dot.index === otherDots[j].index) {
                // Send the other dot back to starting area
                sendDotToStartingArea(otherCanvas, j);
                collision = true;
            }
        }
    }
    return collision;
}

function checkWinCondition(playerCanvas) {
    const allHome = playerCanvas.dots.every(dot => dot.reachedHome);
    if (allHome) {
        const playerName = playerCanvas.player.name;
        updateGameInfo(`🎉 ${playerName} has won the game! 🎉`);
        // You can add additional victory celebration here
        return true;
    }
    return false;
}

function getMoveableDots(currentPlayerCanvas, moveAmount) {
    const dots = currentPlayerCanvas.dots;
    // Filter dots that can move
    const movableDots = dots.filter(dot => {
        if (dot.inStartingArea && moveAmount === gameState.dieFaces) {
            return true;
        } else if (!dot.inStartingArea && !dot.inHomePath) {
            return true;
        } else if (dot.inHomePath && moveAmount <= dot.stepsToHome) {
            return true;
        }
        return false;
    });
    return movableDots;
}

// Auto move function
function autoMove() {
    const moveAmount = gameState.lastRoll;
    const currentPlayerCanvas = playerCanvases[gameState.currentPlayerIndex];
    const dots = currentPlayerCanvas.dots;
    const movableDots = getMoveableDots(currentPlayerCanvas, moveAmount)

    if (movableDots.length > 0) {
        movableDotsInStartingArea = movableDots.filter(dot => dot.inStartingArea);
        movableDotsInHomePath = movableDots.filter(dot => dot.inHomePath);
        // // Randomly select a dot to move
        if (movableDotsInStartingArea.length > 0) {
            const dotIndex = dots.indexOf(movableDotsInStartingArea[Math.floor(Math.random() * movableDotsInStartingArea.length)]);
            moveDotOutOfStartingArea(currentPlayerCanvas, dotIndex, moveAmount);
        } else if (movableDotsInHomePath.length > 0) {
            const dotIndex = dots.indexOf(movableDotsInHomePath[Math.floor(Math.random() * movableDotsInHomePath.length)]);
            moveAlongHomePath(currentPlayerCanvas, dotIndex, moveAmount);
        } else {
            const dotIndex = dots.indexOf(movableDots[Math.floor(Math.random() * movableDots.length)]);
            moveDotAlongMainPath(currentPlayerCanvas, dotIndex, moveAmount);
        }

    } else {
        updateGameInfo(`${players[gameState.currentPlayerIndex].name} cannot move! Next player's turn.`);
        setTimeout(() => {
            nextTurn();
        }, 1000);
    }
}
