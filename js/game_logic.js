// Game state management
// Player management (turns, selection)
// Path calculation and position logic
// Game rules (movement, home entry, etc)
// Win condition checking

// TODO
// larger board - change `boardSizeFactor` and `boardRadius` (in config.js) dynamically ? 
// background color ~ in `styles.css` in `body`
// always widescreen - no screen rotation

//* Note; most of the logic is done here!
// see also `nextTurn` in `js/script.js`
// see also `handleDiceClick` in `js/animations.js`

console.log("`testMode=true` to manually enter a roll value, or `testMode=false` (default) to use random rolls.");
let testMode = false;

function myDice(numberOfDices = 1) {
    if (testMode) {
        const userNumber = parseInt(prompt("Enter a number:"));
        return userNumber;
    }
    return myMaxRetry(numberOfDices);
}

function myMaxRetry(numberOfDices = 1) {
    let roll = simpleDice();
    while (roll < currentBoard.dieSize && numberOfDices > 1) {
        roll = simpleDice();
        numberOfDices--;
    }
    return roll;
}

function myMaxRandom(numberOfDices = 1) {
    numberOfDices > 1 && console.debug(`Rolling ${numberOfDices} dice`);
    const rolls = Array.from({ length: numberOfDices }, simpleDice);
    if (numberOfDices > 1) {
        console.log(`Rolled: ${rolls}`);
    }
    return Math.max(...rolls);
}

function simpleDice() {
    return Math.floor(Math.random() * currentBoard.dieSize) + 1;
}

// get dot out of starting area, and go to `nextTurn`
function moveDotOutOfStartingArea(player, i, moveAmount) {
    console.debug(`moveDotOutOfStartingArea`);
    const playerCanvas = player.display;    
    // Can only move out with when rolling `currentBoard.dieSize` or dot's index
    if (moveAmount === currentBoard.dieSize || moveAmount === -playerCanvas.dots[i].startIndex) {
        const dot = playerCanvas.dots[i];
        // Move to the starting position on the path
        dot.inStartingArea = false;
        dot.index = player.inputIndex;
        dot.targetIndex = player.inputIndex;

        // Animate the movement
        playSound('start');
        animateDotTeleport(player, i, pathToCanvas(pathPoints[player.inputIndex]),
            ()=>nextTurn());
        return;
    } else {
        updateGameInfo(`Need to roll a ${currentBoard.dieSize} or ${-playerCanvas.dots[i].startIndex} to move that dot out! Try another dot.`);
        return;
    }
}

// move dot along home path, and go to `checkWinCondition`
function moveDotAlongHomePath(player, i, moveAmount) {
    console.debug(`moveDotAlongHomePath`);
    const playerCanvas = player.display;    
    const dot = playerCanvas.dots[i];
    if (moveAmount <= dot.stepsToHome) {
        // Move along home path animation
        moveAlongHomePath(player, i, moveAmount, ()=>checkWinCondition(player));
        return;
    } else {
        updateGameInfo(`Need exactly ${dot.stepsToHome} to reach home! Try another dot.`);
        return;
    }
}

// move dot along main path, and go to `checkForCollision`
function moveDotAlongMainPath(player, i, moveAmount) {
    // animate
    console.debug(`moveDotAlongMainPath`);
    const playerCanvas = player.display;
    const dot = playerCanvas.dots[i];
    // Get the current path position
    const currentIndex = dot.index;
    // Check if dot will reach or pass its pivot point
    const pivotIndex = player.outputIndex;
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
    for (k = 0; k < currentBoard.numPlayers; k++) { // loop over other players
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
                if (currentBoard.players[k].autoMove && currentBoard.players[k].style != "Crazy") {
                    if (Math.random() < 0.8) {
                        currentBoard.players[k].style = "Angry"; // make autoMover angry
                    } else {
                        currentBoard.players[k].style = "Crazy"; // make autoMover crazy
                    }
                }
                if (currentBoard.players[currentBoard.currentPlayerIndex].autoMove) {
                    if (currentBoard.players[currentBoard.currentPlayerIndex].style == "Crazy") {
                        if (Math.random() < 0.5) {
                            currentBoard.players[currentBoard.currentPlayerIndex].style = "Angry"; // make autoMover angry
                        } else {
                            if (Math.random() < 0.5) {
                                currentBoard.players[currentBoard.currentPlayerIndex].style = "Nice"; // make autoMover nice
                            } else {
                                currentBoard.players[currentBoard.currentPlayerIndex].style = "Naive"; // make autoMover naive
                            }
                        }
                    } else {
                        currentBoard.players[currentBoard.currentPlayerIndex].style = "Nice"; // relax autoMover
                    }
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

// check if all dots are in home, else, go to `nextTurn`
function checkWinCondition(player) {
    // update score board
    updateScoreBoard();
    // check if all dots are in home
    const playerCanvas = player.display;
    const allHome = playerCanvas.dots.every(dot => dot.reachedHome);
    if (allHome) {
        updateGameInfo(`🎉 ${player.name} has won the game! 🎉     click title to reset.`);
        playSound('win');
        currentBoard.gameEnded = true;
        window.dispatchEvent(new Event('resize'));
        animateMoveableDots(player, 0, true);

        return true;
    } else {
        nextTurn();
    }
    return false;
}

function checkWhoCanMove(player, moveAmount) { // list of true/false if dot can move
    console.debug(`checkWhoCanMove`);
    const playerCanvas = player.display;
    const dots = playerCanvas.dots;
    // check which dot can move
    const canMove = dots.map(dot => {
        if (dot.inStartingArea && (moveAmount === currentBoard.dieSize || moveAmount === -dot.startIndex)) {
            return true;
        } else if (!dot.inStartingArea && !dot.inHomePath) {
            const pivotIndex = player.outputIndex;
            console.debug(`pivotIndex: ${pivotIndex}`);
            const featureIndex = Array.from({ length: moveAmount + 1 }, (_, i) => (dot.index + i) % pathPoints.length);
            console.debug(`featureIndex: ${featureIndex}`);
            const willReachPivot = featureIndex.includes(pivotIndex);
            console.debug(`willReachPivot: ${willReachPivot}`);
            if (!willReachPivot) {return true;};
            console.debug(`willReachPivot: ${willReachPivot}`);
            const stepsAfterPivot = moveAmount - featureIndex.findIndex(index => index === pivotIndex);
            console.debug(`stepsAfterPivot: ${stepsAfterPivot}`);
            console.debug(`stepsAfterPivot <= currentBoard.homeLayerLength`);
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
    console.debug(`canMove: ${canMove}`);
    return canMove;
}

function getMoveableDots(player, moveAmount) {
    console.debug(`getMoveableDots`);
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
            if (dotsGettingHome[i]      ) {moveScore[i] += 1} // move home
            if (dotsInStartingArea[i]   ) {moveScore[i] += 2} // move out of starting area
            if (dotsColliding[i]        ) {moveScore[i] -= 1} //
            moveScore[i] += Math.random() * 2; // add some randomness
        }
    } else if ("Angry" == playerType) {
        for (let i = 0; i < dots.length; i++) {
            if (!canMove[i]             ) {moveScore[i] -= 100} // can move
            if (dotsInSafeZone[i]       ) {moveScore[i] -= 1} // don't move if already in safe zone
            if (dotsGettingToSafeZone[i]) {moveScore[i] += 1} // move to safe zone
            if (dotsGettingHome[i]      ) {moveScore[i] += 2} // move home
            if (dotsInStartingArea[i]   ) {moveScore[i] += 3} // move out of starting area
            if (dotsColliding[i]        ) {moveScore[i] += 8} //
            moveScore[i] += Math.random() * 2; // add some randomness
        }
    } else if ("Nice" == playerType) {
        for (let i = 0; i < dots.length; i++) {
            if (!canMove[i]             ) {moveScore[i] -= 100} // can move
            if (dotsInSafeZone[i]       ) {moveScore[i] -= 1} // don't move if already in safe zone
            if (dotsGettingToSafeZone[i]) {moveScore[i] += 1} // move to safe zone
            if (dotsGettingHome[i]      ) {moveScore[i] += 2} // move home
            if (dotsInStartingArea[i]   ) {moveScore[i] += 3} // move out of starting area
            if (dotsColliding[i]        ) {moveScore[i] -= 0.1} //
            moveScore[i] += Math.random() * 0.01; // add some randomness
        }
    } else if ("Human" == playerType) { // random
        for (let i = 0; i < dots.length; i++) {
            if (!canMove[i]             ) {moveScore[i] -= 100} // can move
            moveScore[i] += Math.random() * 0.01; // add some randomness
        }
    } else if ("Crazy" == playerType) {
        for (let i = 0; i < dots.length; i++) {
            if (!canMove[i]             ) {moveScore[i] -= 100} // can move
            if (dotsInSafeZone[i]       ) {moveScore[i] += 3} // don't move if already in safe zone
            if (dotsGettingToSafeZone[i]) {moveScore[i] += 1} // move to safe zone
            if (dotsGettingHome[i]      ) {moveScore[i] += 2} // move home
            if (dotsInStartingArea[i]   ) {moveScore[i] += 4} // move out of starting area
            if (dotsColliding[i]        ) {moveScore[i] += 8} //
            moveScore[i] += Math.random() * 1.2; // add some randomness
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


function calcScore() {
    scores = Array.from({ length: currentBoard.numPlayers }, () => 0);
    for (let i = 0; i < currentBoard.numPlayers; i++) {
        for (let j = 0; j < currentBoard.players[i].display.dots.length; j++) {
            dot = currentBoard.players[i].display.dots[j];
            if (dot.inStartingArea) {continue}
            scores[i] += currentBoard.dieSize // move out of starting area
            dist = dot.index - currentBoard.players[i].inputIndex
            if (dist < 0) {dist += currentBoard.circuitLength}
            scores[i] += dist
            if (dot.inHomePath) {scores[i] += dot.homePathStep}
        }
    }
    return scores;
}
