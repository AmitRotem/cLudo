// Game state management
// Player management (turns, selection)
// Path calculation and position logic
// Game rules (movement, home entry, etc)
// Win condition checking

// TODO now
// preper to quantize the game - add `state` and `pattern` to playerCanvas, add `measurement` and `project` functions, redestribute pattern in starting area if possible, finally add `selfInteraction` function (game start classical, then quantum effects comes in via `selfInteraction`, like in a HOM experiment)\


// TODO later
// larger board - change `boardSizeFactor` and `boardRadius` (in config.js) dynamically ? 
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
    if (testMode) {
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
    // safeIndex - stars
    if (gameState.safeIndex.includes(dot.index) || dot.inHomePath || dot.inStartingArea) {
        checkWinCondition(currentPlayerCanvas);
        return false;
    }
    // Check if the dot landed on another dot
    let collision = false;
    for (k = 0; k < playerCanvases.length; k++) { // loop over other players
        if (k == gameState.currentPlayerIndex) {
            continue; // skip current player
        }
        const otherCanvas = playerCanvases[k];
        const otherDots = otherCanvas.dots;
        for (j = 0; j < otherDots.length; j++) { // loop over other dots
            if (otherDots[j].reachedHome || otherDots[j].inHomePath || otherDots[j].inStartingArea) {
                continue; // safe zones - safeIndex already checked by current player
            }
            if (dot.index === otherDots[j].index) {
                // Send the other dot back to starting area
                sendDotToStartingArea(otherCanvas, j, (collision ? ()=>{} : ()=>{checkWinCondition(currentPlayerCanvas);}));
                if (gameState.autoMover[k]) {
                    gameState.playerType[k] = "Angry"; // make autoMover angry
                }
                if (gameState.autoMover[gameState.currentPlayerIndex]) {
                    gameState.playerType[gameState.currentPlayerIndex] = "Nice"; // relax autoMover
                }
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
    updateScoreBoard();
    const allHome = playerCanvas.dots.every(dot => dot.reachedHome);
    if (allHome) {
        const playerName = playerCanvas.player.name;
        updateGameInfo(`🎉 ${playerName} has won the game! 🎉`);
        playSound('win');
        gameState.gameEnded = true;
        // You can add additional victory celebration here
        return true;
    } else {
        nextTurn();
    }
    return false;
}

function checkWhoCanMove(currentPlayerCanvas, moveAmount) { // list of true/false if dot can move
    const dots = currentPlayerCanvas.dots;
    // check which dot can move
    const canMove = dots.map(dot => {
        if (dot.inStartingArea && moveAmount === gameState.dieFaces) {
            return true;
        } else if (!dot.inStartingArea && !dot.inHomePath) {
            const pivotIndex = gameState.pivotIndex[gameState.currentPlayerIndex];
            const featureIndex = Array.from({ length: moveAmount + 1 }, (_, i) => (dot.index + i) % pathPoints.length);
            const willPassPivot = featureIndex.slice(0,-1).includes(pivotIndex);
            if (!willPassPivot) {return true;};
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
    return canMove;
}

function getMoveableDots(currentPlayerCanvas, moveAmount) {
    const canMove = checkWhoCanMove(currentPlayerCanvas, moveAmount)
    return currentPlayerCanvas.dots.filter((_, i) => canMove[i]);
}

// Auto move function
function autoMove() {
    const moveAmount = gameState.lastRoll;
    const currentPlayerCanvas = playerCanvases[gameState.currentPlayerIndex];
    const dots = currentPlayerCanvas.dots;    
    const canMove = checkWhoCanMove(currentPlayerCanvas, moveAmount)
    // const movableDots = getMoveableDots(currentPlayerCanvas, moveAmount)
    // cannot move
    if (canMove.every(dot => !dot)) {
        const allAutoMovers = gameState.autoMover;
        updateGameInfo(`${players[gameState.currentPlayerIndex].name} cannot move! Next player's turn.`);
        setTimeout(() => {
            nextTurn();
        }, 1000 * (allAutoMovers ? fastSpeedFactor : 1));
        return;
    }
    // get all other dots not in safe zones
    const allOtherDots = playerCanvases.filter(pc => pc !== currentPlayerCanvas).map(pc => pc.dots).flat().filter(dot => !dot.inHomePath && !dot.inStartingArea);
    const allOtherDotsIndex = allOtherDots.map(dot => dot.index).filter(idx => !gameState.safeIndex.includes(idx));

    // prioritize moves
    const dotsInSafeZone = dots.map(dot => dot.inHomePath || gameState.safeIndex.includes(dot.index));
    const dotsGettingToSafeZone = dots.map(dot => dot.inHomePath || gameState.safeIndex.includes((dot.index + moveAmount + pathPoints.length) % pathPoints.length));
    const dotsInStartingArea = dots.map(dot => dot.inStartingArea);
    const dotsGettingHome = dots.map(dot => dot.inHomePath && dot.stepsToHome == moveAmount);
    const dotsColliding = dots.map(dot => allOtherDotsIndex.includes((dot.index + moveAmount + pathPoints.length) % pathPoints.length));
    
    const playerType = gameState.playerType[gameState.currentPlayerIndex];
    moveScore = Array.from({ length: dots.length }, () => 0);
    if ("Naive" == playerType) {
        for (let i = 0; i < dots.length; i++) {
            if (!canMove[i]             ) {moveScore[i] -= 100} // can move
            if (dotsInSafeZone[i]       ) {moveScore[i] -= 0} // don't move if already in safe zone
            if (dotsGettingToSafeZone[i]) {moveScore[i] += 0} // move to safe zone
            if (dotsGettingHome[i]      ) {moveScore[i] += 2} // move home
            if (dotsInStartingArea[i]   ) {moveScore[i] += 4} // move out of starting area
            if (dotsColliding[i]        ) {moveScore[i] -= 8} //
            moveScore[i] += Math.random() * 0.01; // add some randomness
        }
    } else if ("Angry" == playerType) {
        for (let i = 0; i < dots.length; i++) {
            if (!canMove[i]             ) {moveScore[i] -= 100} // can move
            if (dotsInSafeZone[i]       ) {moveScore[i] -= 1} // don't move if already in safe zone
            if (dotsGettingToSafeZone[i]) {moveScore[i] += 1} // move to safe zone
            if (dotsGettingHome[i]      ) {moveScore[i] += 2} // move home
            if (dotsInStartingArea[i]   ) {moveScore[i] += 4} // move out of starting area
            if (dotsColliding[i]        ) {moveScore[i] += 8} //
            moveScore[i] += Math.random() * 0.01; // add some randomness
        }
    } else if ("Nice" == playerType) {
        for (let i = 0; i < dots.length; i++) {
            if (!canMove[i]             ) {moveScore[i] -= 100} // can move
            if (dotsInSafeZone[i]       ) {moveScore[i] -= 1} // don't move if already in safe zone
            if (dotsGettingToSafeZone[i]) {moveScore[i] += 1} // move to safe zone
            if (dotsGettingHome[i]      ) {moveScore[i] += 2} // move home
            if (dotsInStartingArea[i]   ) {moveScore[i] += 4} // move out of starting area
            if (dotsColliding[i]        ) {moveScore[i] -= 0} //
            moveScore[i] += Math.random() * 0.01; // add some randomness
        }
    } else if ("Human" == playerType) { // random
        for (let i = 0; i < dots.length; i++) {
            if (!canMove[i]             ) {moveScore[i] -= 100} // can move
            moveScore[i] += Math.random() * 0.01; // add some randomness
        }
    } else {ErrorEvent("Unknown player type!")}
    
    const dotIndex = moveScore.indexOf(Math.max(...moveScore));
    console.assert(canMove[dotIndex], `Dot at index ${dotIndex} cannot move!`);

    // move choosen dot
    const dotToMove = dots[dotIndex];
    if (dotToMove.inStartingArea) {
        moveDotOutOfStartingArea(currentPlayerCanvas, dotIndex, moveAmount);
    } else if (dotToMove.inHomePath) {
        moveDotAlongHomePath(currentPlayerCanvas, dotIndex, moveAmount);
    } else {
        moveDotAlongMainPath(currentPlayerCanvas, dotIndex, moveAmount);
    }

}


function moveDot(currentPlayerCanvas, dotIndex, moveAmount) {
    const dotToMove = currentPlayerCanvas.dots[dotIndex];
    if (dotToMove.inStartingArea) {
        moveDotOutOfStartingArea(currentPlayerCanvas, dotIndex, moveAmount);
    } else if (dotToMove.inHomePath) {
        moveDotAlongHomePath(currentPlayerCanvas, dotIndex, moveAmount);
    } else {
        moveDotAlongMainPath(currentPlayerCanvas, dotIndex, moveAmount);
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


function calcScore() {
    scores = Array.from({ length: gameState.numberOfPlayers }, () => 0);
    for (let i = 0; i < gameState.numberOfPlayers; i++) {
        for (let j = 0; j < playerCanvases[i].dots.length; j++) {
            dot = playerCanvases[i].dots[j];
            if (dot.inStartingArea) {continue}
            scores[i] += gameState.dieFaces // move out of starting area
            dist = dot.index - dot.pathEntryIndex
            if (dist < 0) {dist += gameState.maxT}
            scores[i] += dist
            if (dot.inHomePath) {scores[i] += dot.homePathStep}
        }
    }
    return scores;
}
