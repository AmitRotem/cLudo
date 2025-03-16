// Game state management
// Player management (turns, selection)
// Path calculation and position logic
// Game rules (movement, home entry, etc)
// Win condition checking

// TODO now
// game is stuck on 2nd 6 - fix it
// remove emoji heads
// make currentBoard.players[k].display.dots defined by values from currentBoard.players[k] - and remove redundant values from currentBoard.players[k].display.dots
// any changes ...dots should come from changes in currentBoard.players[k]
// preper to quantize the game - add `state` and `pattern` to playerCanvas, add `measurement` and `project` functions, redestribute pattern in starting area if possible, finally add `selfInteraction` function (game start classical, then quantum effects comes in via `selfInteraction`, like in a HOM experiment)\


// TODO later
// larger board - change `boardSizeFactor` and `boardRadius` (in config.js) dynamically ? 
// background color ~ in `styles.css` in `body`
// always widescreen - no screen rotation

//* Note; most of the logic is done here!
// see also `nextTurn` in `js/script.js`
// see also `handleDiceClick` in `js/animations.js`

let testMode = false
function test1() {
    testMode = !testMode;
    console.log(`Test mode: ${testMode}`);
    return testMode;
}

function test2() {
    currentBoard.players.forEach(player => {
        player.autoMove = true;
        player.style = "Naive";
    });
    console.log(`Test mode 2: auto play on`);
    handleDiceClick();
}

function myMaxRandom(numberOfDices = 1) {
    numberOfDices > 1 && console.debug(`Rolling ${numberOfDices} dice`);
    const rolls = Array.from({ length: numberOfDices }, () => Math.floor(Math.random() * currentBoard.dieSize) + 1);
    if (testMode) {
        const userNumber = parseInt(prompt("Enter a number:"));
        return userNumber;
    }
    return Math.max(...rolls);
}

// get dot out of starting area, and go to `nextTurn`
function moveDotOutOfStartingArea(player, i, moveAmount) {
    console.debug(`moveDotOutOfStartingArea`);
    const playerCanvas = player.display;    
    // Can only move out with when rolling `currentBoard.dieSize`
    if (moveAmount === currentBoard.dieSize) {
        const dot = playerCanvas.dots[i];
        // Move to the starting position on the path
        dot.inStartingArea = false;
        dot.index = dot.pathEntryIndex;
        dot.targetIndex = dot.pathEntryIndex;
        
        // Animate the movement
        playSound('start');
        animateDotTeleport(player, i, pathToCanvas(pathPoints[dot.pathEntryIndex]),
            ()=>nextTurn());
        return;
    } else {
        updateGameInfo(`Need to roll a ${currentBoard.dieSize} to move out! Try another dot.`);
        return;
    }
}

// move dot along home path, and go to `checkWinCondition`
function moveDotAlongHomePath(player, i, moveAmount) {
    console.debug(`moveDotAlongHomePath`);
    const playerCanvas = player.display;    
    const dot = playerCanvas.dots[i];
    if (moveAmount <= dot.stepsToHome) {
        // Move along home path
        moveAlongHomePath(player, i, moveAmount, ()=>checkWinCondition(player));
        return;
    } else {
        updateGameInfo(`Need exactly ${dot.stepsToHome} to reach home! Try another dot.`);
        return;
    }
}

// move dot along main path, and go to `checkForCollision`
function moveDotAlongMainPath(player, i, moveAmount) {
    console.debug(`moveDotAlongMainPath`);
    const playerCanvas = player.display;
    const dot = playerCanvas.dots[i];
    // Get the current path position
    const currentIndex = dot.index;
    // Check if dot will reach or pass its pivot point
    const pivotIndex = currentBoard.players[currentBoard.currentPlayerIndex].outputIndex;
    const featureIndex = Array.from({ length: moveAmount + 1 }, (_, i) => (currentIndex + i) % currentBoard.circuitLength);
    const willPassPivot = featureIndex.slice(0,-1).includes(pivotIndex);

    if (willPassPivot) {
        // Determine remaining steps after reaching pivot
        const stepsAfterPivot = moveAmount - featureIndex.findIndex(index => index === pivotIndex);
        
        // If remaining steps <= currentBoard.homeLayerLength (length of home path), move to home path
        if (stepsAfterPivot <= currentBoard.homeLayerLength) {
            // First move to pivot
            moveToHomePathEntry(player, i, stepsAfterPivot, () => {checkForCollision(player, i);}); // and continue to move along home path
        } else {
            updateGameInfo(`Cannot go past home! Try another dot.`);
        }
    } else {
        // Normal path movement
        moveMultipleSteps(player, i, moveAmount, 1,
            () => {checkForCollision(player, i);});
    }
}

// checkForCollision, and go to `checkWinCondition`
function checkForCollision(player, i) {
    console.debug(`checkForCollision`);
    const playerCanvas = player.display;
    const dot = playerCanvas.dots[i];
    // safeIndex - stars
    if (currentBoard.safeIndcies.includes(dot.index) || dot.inHomePath || dot.inStartingArea) {
        checkWinCondition(player);
        return false;
    }
    // Check if the dot landed on another dot
    let collision = false;
    for (k = 0; k < currentBoard.players.length; k++) { // loop over other players
        if (k == currentBoard.currentPlayerIndex) {
            continue; // skip current player
        }
        const otherPlayer = currentBoard.players[k];
        const otherCanvas = otherPlayer.display;
        const otherDots = otherCanvas.dots;
        for (j = 0; j < otherDots.length; j++) { // loop over other dots
            if (otherDots[j].reachedHome || otherDots[j].inHomePath || otherDots[j].inStartingArea) {
                continue; // safe zones - safeIndex already checked by current player
            }
            if (dot.index === otherDots[j].index) {
                // Send the other dot back to starting area
                sendDotToStartingArea(otherPlayer, j, (collision ? ()=>{} : ()=>{checkWinCondition(player);}));
                if (currentBoard.players[k].autoMove) {
                    currentBoard.players[k].style = "Angry"; // make autoMover angry
                }
                if (currentBoard.players[currentBoard.currentPlayerIndex].autoMove) {
                    currentBoard.players[currentBoard.currentPlayerIndex].style = "Nice"; // relax autoMover
                }
                collision = true;
                currentBoard.extraTurn = true;
            }
        }
    }
    if (collision) {
        updateGameInfo(`Collision! ${player.name} gets an extra turn!`);
        playSound('collision');
    } else {
        checkWinCondition(player);
    }
    return collision;
}

// check if al dots are in home, else, and go to `nextTurn`
function checkWinCondition(player) {
    updateScoreBoard();
    const playerCanvas = player.display;
    const allHome = playerCanvas.dots.every(dot => dot.reachedHome);
    if (allHome) {
        updateGameInfo(`🎉 ${player.name} has won the game! 🎉`);
        playSound('win');
        currentBoard.gameEnded = true;
        // You can add additional victory celebration here
        return true;
    } else {
        nextTurn();
    }
    return false;
}

function checkWhoCanMove(player, moveAmount) { // list of true/false if dot can move
    const playerCanvas = player.display;
    const dots = playerCanvas.dots;
    // check which dot can move
    const canMove = dots.map(dot => {
        if (dot.inStartingArea && moveAmount === currentBoard.dieSize) {
            return true;
        } else if (!dot.inStartingArea && !dot.inHomePath) {
            const pivotIndex = gameState.pivotIndex[gameState.currentPlayerIndex];
            const featureIndex = Array.from({ length: moveAmount + 1 }, (_, i) => (dot.index + i) % pathPoints.length);
            const willReachPivot = featureIndex.includes(pivotIndex);
            if (!willReachPivot) {return true;};
            const stepsAfterPivot = moveAmount - featureIndex.findIndex(index => index === pivotIndex);
            if (stepsAfterPivot <= currentBoard.homeLayerLength) {
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

function getMoveableDots(player, moveAmount) {
    const canMove = checkWhoCanMove(player, moveAmount)
    return player.display.dots.filter((_, i) => canMove[i]);
}

// Auto move function
function autoMove() {
    console.debug(`autoMove`);
    const player = currentBoard.players[currentBoard.currentPlayerIndex];
    const moveAmount = player.die;
    const playerCanvas = player.display;
    const dots = playerCanvas.dots;    
    const canMove = checkWhoCanMove(player, moveAmount)

    // cannot move
    if (canMove.every(dot => !dot)) {
        const allAutoMovers = currentBoard.players.every(player => player.autoMove);
        updateGameInfo(`${player.name} cannot move! Next player's turn.`);
        setTimeout(() => {
            nextTurn();
        }, 1000 * (allAutoMovers ? fastSpeedFactor : 1));
        return;
    }
    // get all other dots not in safe zones
    const allOtherDots = currentBoard.players.filter(pc => pc !== player).map(pc => pc.display.dots).flat().filter(dot => !dot.inHomePath && !dot.inStartingArea);
    const allOtherDotsIndex = allOtherDots.map(dot => dot.index).filter(idx => !currentBoard.safeIndcies.includes(idx));

    // prioritize moves
    const dotsInSafeZone = dots.map(dot => dot.inHomePath || currentBoard.safeIndcies.includes(dot.index));
    const dotsGettingToSafeZone = dots.map(dot => dot.inHomePath || currentBoard.safeIndcies.includes((dot.index + moveAmount + pathPoints.length) % pathPoints.length));
    const dotsInStartingArea = dots.map(dot => dot.inStartingArea);
    const dotsGettingHome = dots.map(dot => dot.inHomePath && dot.stepsToHome == moveAmount);
    const dotsColliding = dots.map(dot => allOtherDotsIndex.includes((dot.index + moveAmount + pathPoints.length) % pathPoints.length));
    
    const playerType = currentBoard.players[currentBoard.currentPlayerIndex].style;
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
        moveDotOutOfStartingArea(player, dotIndex, moveAmount);
    } else if (dotToMove.inHomePath) {
        moveDotAlongHomePath(player, dotIndex, moveAmount);
    } else {
        moveDotAlongMainPath(player, dotIndex, moveAmount);
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
    scores = Array.from({ length: currentBoard.numPlayers }, () => 0);
    for (let i = 0; i < currentBoard.numPlayers; i++) {
        for (let j = 0; j < currentBoard.players[i].display.dots.length; j++) {
            dot = currentBoard.players[i].display.dots[j];
            if (dot.inStartingArea) {continue}
            scores[i] += currentBoard.dieSize // move out of starting area
            dist = dot.index - dot.pathEntryIndex
            if (dist < 0) {dist += currentBoard.circuitLength}
            scores[i] += dist
            if (dot.inHomePath) {scores[i] += dot.homePathStep}
        }
    }
    return scores;
}
