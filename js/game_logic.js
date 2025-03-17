// Game state management
// Player management (turns, selection)
// Path calculation and position logic
// Game rules (movement, home entry, etc)
// Win condition checking

// TODO
// player.bosonsInPlay # calc from locations ?
// player.finishedBosons # calc from locations ?
// define selfInteraction
// define project
// define projectOnDetector
// define syncPlayerAndDisplay


// TODO later
// larger board - change `boardSizeFactor` and `boardRadius` (in config.js) dynamically ? 
// background color ~ in `styles.css` in `body`
// always widescreen - no screen rotation

//* Note; most of the logic is done here!
// see also `nextTurn` in `js/script.js`
// see also `handleDiceClick` in `js/animations.js`


function getMeanBosonNumbers(player) {
    return player.patterns.reduce((sum, pattern, j) => math.add(sum, math.multiply(pattern, Math.abs(player.state[j]) ** 2)), 0);
}

function move(player, i) {
    if (0 > player.locations[i].im && player.die === currentBoard.dieSize) {
        player.locations[i].im = 0;
    } else if (0 <= player.locations[i].im) {
        for (let j = 0; j < player.die; j++) {
            if (player.outputIndex == player.locations[i].re) {
                player.locations[i].im++;
            } else {
                player.locations[i].re++;
                player.locations[i].re = player.locations[i].re % currentBoard.circuitLength
            }
        }
    } else {
        console.error(`player ${currentBoard.currentPlayerIndex} dot ${i} cannot move!`);
    }
}

function selfInteraction(player, i) {
    const iloc = player.locations[i]
    const interacting = player.locations.map((jloc, j) => math.equal(iloc, jloc) )
    if (2 > interacting.length) {return;}
    // TODO
    // adjust state and patterns
}

function project(player, i) {
    const iloc = player.locations[i];
    if (0 < iloc.im) {return;} // already in home path
    if (0 > iloc.im) {console.error(`player ${currentBoard.currentPlayerIndex} dot ${i} cannot project!`); return;} // in starting area
    if (0 === iloc.im && currentBoard.safeIndcies.includes(iloc.re)) {return;} // safe zone
    for (let j = 0; j < currentBoard.numPlayers; j++) {
        if (j == currentBoard.currentPlayerIndex) {
            continue; // skip current player
        }
        const otherPlayer = currentBoard.players[j];
        for (k = 0; k < currentBoard.numBosons; k++) {
            if (math.equal(otherPlayer.locations[k], iloc)) {
                // TODO
                // dark measure player
                // if positive
                // bright measure other players
                otherPlayer.locations[k] = math.complex(otherPlayer.inputIndex, -k-1);
            }
        }
    }
        
}

function projectOnDetector(player, i) {
    // number resolved detector
}



function syncPlayerAndDisplay(player) {
    // update player.display based on board
    //

    const dots = player.display.dots;
    // numBosons
    console.assert(dots.length === player.numBosons, player, `number of dots is incompatible with numBosons!! got ${dots.length} expected ${player.numBosons}`);

    // inStartingArea
    console.assert(dots.every((dot,j) => (dot.inStartingArea ? (player.locations[j].im < 0) : (player.locations[j].im>=0))), player, `inStartingArea is incompatible with locations!! dots have ${dots.map(dot => dot.inStartingArea)} but locations are ${player.locations.map(location => location.im)}`);

    // index
    console.assert(dots.every((dot,j) => (dot.inStartingArea ? true : (dot.index === player.locations[j].re))), player, `index is incompatible with locations!! dots have ${dots.map(dot => dot.index)} but locations are ${player.locations.map(location => location.re)}`);

    // inHomePath
    console.assert(dots.every((dot,j) => (dot.inHomePath ? (player.locations[j].im === dot.homePathStep) : (player.locations[j].im <= 0))), player, `homePathStep is incompatible with locations!! dots have ${dots.map(dot => dot.inHomePath)} with steps ${dots.map(dot => dot.homePathStep)} but locations are ${player.locations.map(location => location.im)}`);
    


    /// if in home path;
    // stepsToHome # Int

    // player.state
    // player.patterns
    // player.bosonsInPlay # calc from locations ?
    // player.finishedBosons # calc from locations ?
}

function syncBoardAndDisplay() {
    console.assert(currentBoard.players.length === currentBoard.numPlayers, currentBoard, `number of players is incompatible with numPlayers!! got ${currentBoard.players.length} expected ${currentBoard.numPlayers}`);
    console.assert(currentBoard.players.every(player => player.dieSize === currentBoard.dieSize), currentBoard, `dieSize is incompatible with currentBoard.dieSize!! got ${currentBoard.players.map(player => player.dieSize)} expected ${currentBoard.dieSize}`);
    currentBoard.players.map(syncPlayerAndDisplay);
}



let testMode = false
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
        dot.index = player.inputIndex;
        dot.targetIndex = player.inputIndex;
        
        // Quantum
        move(player, i);
        selfInteraction(player, i);

        // Animate the movement
        playSound('start');
        animateDotTeleport(player, i, pathToCanvas(pathPoints[player.inputIndex]),
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
        // Quantum
        move(player, i);
        selfInteraction(player, i);
        projectOnDetector(player, i);
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
    // Quantum
    move(player, i);
    selfInteraction(player, i);
    project(player, i);
    
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
                // check if there was actually a collision - due to project
                const Navg = getMeanBosonNumbers(otherPlayer)
                if ((0 > otherPlayer.locations[j].im) && (0 < Navg[j])) {
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
                } else {
                    console.debug(`No collision! dark measurement!`);
                    console.debug(`player ${currentBoard.currentPlayerIndex} dot ${i} collided with player ${k} dot ${j}`);

                    otherDots[j].inStartingArea = true;
                    otherDots[j].index = -1;
                    otherDots[j].targetIndex = -1;
                    // TODO make this dot invisible
                    animateDotTeleport(otherPlayer, j, otherDots[j].startPosition)
                }
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
    // sync dots with quantum board
    // measurement ...
    syncBoardAndDisplay();
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
        animateMoveableDots(player, 0, true)

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
        if (dot.inStartingArea && moveAmount === currentBoard.dieSize) {
            return true;
        } else if (!dot.inStartingArea && !dot.inHomePath) {
            const pivotIndex = player.outputIndex;
            console.debug(`pivotIndex: ${pivotIndex}`);
            const featureIndex = Array.from({ length: moveAmount + 1 }, (_, i) => (dot.index + i) % pathPoints.length);
            console.debug(`featureIndex: ${featureIndex}`);
            const willReachPivot = featureIndex.includes(pivotIndex);
            console.debug
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
            if (dotsColliding[i]        ) {moveScore[i] -= 0.1} //
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
