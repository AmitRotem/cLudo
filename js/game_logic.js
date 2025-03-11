// Game state management
// Player management (turns, selection)
// Path calculation and position logic
// Game rules (movement, home entry, etc)
// Win condition checking

// TODO now
// preper to quantize the game - add `state` and `pattern` to playerCanvas, add `measurement` and `project` functions, redestribute pattern in starting area if possible, finally add `selfInteraction` function (game start classical, then quantum effects comes in via `selfInteraction`, like in a HOM experiment)

// TODO later
// larger board, by at least factor of 1.1 !! - change `boardSizeFactor` and `boardRadius` (in config.js) dynamically ? 
// fix dice location, e.g., see 5 players
// background color ~ in `styles.css` in `body`
// always widescreen - no screen rotation

//* Note; most of the logic is done here!
// see also `nextTurn` in `js/script.js`
// see also `handleDiceClick` in `js/animations.js`

let testMode = false
function test() {
    testMode = !testMode;
    console.log(`Test mode: ${testMode}`);
    return testMode;
}

function myMaxRandom(numberOfDices = 1) {
    numberOfDices > 1 && console.log(`Rolling ${numberOfDices} dice`);
    const rolls = Array.from({ length: numberOfDices }, () => Math.floor(Math.random() * gameState.dieFaces) + 1);
    if (testMode && !gameState.autoMover[gameState.currentPlayerIndex]) {
        const userNumber = parseInt(prompt("Enter a number:"));
        return userNumber;
    }
    return Math.max(...rolls);
}

// get dot out of starting area, and go to `nextTurn`
function moveDotOutOfStartingArea(currentPlayerCanvas, i, moveAmount) {
    // Can only move out with when rolling `gameState.dieFaces`
    if (moveAmount === gameState.dieFaces) {
        const dot = currentPlayerCanvas.dots[i];
        // Move to the starting position on the path
        dot.inStartingArea = false;
        dot.index = dot.pathEntryIndex;
        dot.targetIndex = dot.pathEntryIndex;
        
        // Animate the movement
        playSound('start');
        animateDotTeleport(currentPlayerCanvas, i, pathToCanvas(pathPoints[dot.pathEntryIndex]),
            ()=>nextTurn());
        return;
    } else {
        updateGameInfo(`Need to roll a ${gameState.dieFaces} to move out! Try another dot.`);
        return;
    }
}

// move dot along home path, and go to `checkWinCondition`
function moveDotAlongHomePath(currentPlayerCanvas, i, moveAmount) {
    const dot = currentPlayerCanvas.dots[i];
    if (moveAmount <= dot.stepsToHome) {
        // Move along home path
        moveAlongHomePath(currentPlayerCanvas, i, moveAmount, ()=>checkWinCondition(currentPlayerCanvas));
        return;
    } else {
        updateGameInfo(`Need exactly ${dot.stepsToHome} to reach home! Try another dot.`);
        return;
    }
}

// move dot along main path, and go to `checkForCollision`
function moveDotAlongMainPath(currentPlayerCanvas, i, moveAmount) {
    const dot = currentPlayerCanvas.dots[i];
    // Get the current path position
    const currentIndex = dot.index;
    // Check if dot will reach or pass its pivot point
    const pivotIndex = gameState.pivotIndex[gameState.currentPlayerIndex];
    const featureIndex = Array.from({ length: moveAmount + 1 }, (_, i) => (currentIndex + i) % pathPoints.length);
    const willPassPivot = featureIndex.slice(0,-1).includes(pivotIndex);

    if (willPassPivot) {
        // Determine remaining steps after reaching pivot
        const stepsAfterPivot = moveAmount - featureIndex.findIndex(index => index === pivotIndex);
        
        // If remaining steps <= gameState.pathToHome (length of home path), move to home path
        if (stepsAfterPivot <= gameState.pathToHome) {
            // First move to pivot
            moveToHomePathEntry(currentPlayerCanvas, i, stepsAfterPivot, () => {checkForCollision(currentPlayerCanvas, i);}); // and continue to move along home path
        } else {
            updateGameInfo(`Cannot go past home! Try another dot.`);
        }
    } else {
        // Normal path movement
        moveMultipleSteps(currentPlayerCanvas, i, moveAmount, 1,
            () => {checkForCollision(currentPlayerCanvas, i);});
    }
}

// checkForCollision, and go to `checkWinCondition`
function checkForCollision(currentPlayerCanvas, i) {
    const dot = currentPlayerCanvas.dots[i];
    // safeIndex, that stars
    if (gameState.safeIndex.includes(dot.index) || dot.inHomePath || dot.inStartingArea) {
        checkWinCondition(currentPlayerCanvas);
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
                sendDotToStartingArea(otherCanvas, j, (collision ? ()=>{} : ()=>{checkWinCondition(currentPlayerCanvas);}));
                collision = true;
                gameState.extraTurn = true;
            }
        }
    }
    if (collision) {
        updateGameInfo(`Collision! ${currentPlayerCanvas.player.name} gets an extra turn!`);
        playSound('collision');
    } else {
        checkWinCondition(currentPlayerCanvas);
    }
    return collision;
}

// check if al dots are in home, else, and go to `nextTurn`
function checkWinCondition(playerCanvas) {
    const allHome = playerCanvas.dots.every(dot => dot.reachedHome);
    if (allHome) {
        const playerName = playerCanvas.player.name;
        updateGameInfo(`🎉 ${playerName} has won the game! 🎉`);
        playSound('win');
        // You can add additional victory celebration here
        return true;
    } else {
        nextTurn();
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
            const pivotIndex = gameState.pivotIndex[gameState.currentPlayerIndex];
            const featureIndex = Array.from({ length: moveAmount + 1 }, (_, i) => (dot.index + i) % pathPoints.length);
            const willReachPivot = featureIndex.includes(pivotIndex);
            if (!willReachPivot) {return true;};
            const stepsAfterPivot = moveAmount - featureIndex.findIndex(index => index === pivotIndex);
            if (stepsAfterPivot <= gameState.pathToHome) {
                return true;
            } else {
                return false;
            }
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
    const allAutoMovers = gameState.autoMover.every(autoMover => autoMover);

    if (movableDots.length > 0) {
        movableDotsInStartingArea = movableDots.filter(dot => dot.inStartingArea);
        movableDotsInHomePath = movableDots.filter(dot => dot.inHomePath);
        // Randomly select a dot to move
        if (movableDotsInStartingArea.length > 0) {
            const dotIndex = dots.indexOf(movableDotsInStartingArea[Math.floor(Math.random() * movableDotsInStartingArea.length)]);
            moveDotOutOfStartingArea(currentPlayerCanvas, dotIndex, moveAmount);
        } else if (movableDotsInHomePath.length > 0) {
            const dotIndex = dots.indexOf(movableDotsInHomePath[Math.floor(Math.random() * movableDotsInHomePath.length)]);
            moveDotAlongHomePath(currentPlayerCanvas, dotIndex, moveAmount);
        } else {
            const dotIndex = dots.indexOf(movableDots[Math.floor(Math.random() * movableDots.length)]);
            moveDotAlongMainPath(currentPlayerCanvas, dotIndex, moveAmount);
        }

    } else {
        updateGameInfo(`${players[gameState.currentPlayerIndex].name} cannot move! Next player's turn.`);
        setTimeout(() => {
            nextTurn();
        }, 1000 * (allAutoMovers ? fastSpeedFactor : 1));
    }
}


function testDice(N = 2**14) {
    let rolls = Array.from({ length: N }, () => myMaxRandom());
    const occurences = rolls.reduce((acc, value) => {
        acc[value - 1]++;
        return acc;
    }, [0,0,0,0,0,0]);
    const meanOccurences = occurences.map(occurence => (occurence / N - 1 / 6)/(Math.sqrt(5/N)/6));
    
    const meanRolls = rolls.reduce((a, b) => a + b, 0) / N
    rolls = rolls.map(value => value - meanRolls);
    let c0 = rolls.map((value, index) => value * rolls[index])
    c0 = c0.reduce((acc, value) => acc + value, 0) / rolls.length
    let c1 = rolls.slice(0, -1).map((value, index) => value * rolls[index + 1])
    c1 = c1.reduce((acc, value) => acc + value, 0) / (rolls.length-1)
    return meanOccurences.map(value => Math.round(value * 10000) / 10000) + ";;corr;;" + [c1/c0];
}