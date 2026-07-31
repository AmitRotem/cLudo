// Import all modules
// Initialize the game
// Set up event listeners
// Window load and resize handlers


// Initialize the game
function initGame() {
    // Random seed
    Math.seedrandom(Date.now());

    // Set up responsive layout
    updateDimensions();
    updateVisualElements();
    
    // Draw the curves first
    drawCurves();
    
    // Then initialize dots
    initializeDots();
    
    // Add player controls
    createPlayerControls();
    
    // Create dice element
    createDiceElement();
    
    // Set up click handler
    container.onclick = function(e) {
        if (currentBoard.gameStarted) {
            handleCanvasClick(e);
            removePawnSelectionMenu();
        } else {
            handleSetupClick(e);
        }
    };
    
    // Make all player canvases non-interactive
    currentBoard.players.forEach(pl => {
        pl.display.canvas.style.pointerEvents = 'none';
    });
    
    // Reset dice state
    currentBoard.diceRolled = false;
    currentBoard.players[currentBoard.currentPlayerIndex].die = null;
    currentBoard.extraTurn = false;
    
    updateGameInfo(`${currentBoard.players[currentBoard.currentPlayerIndex].name}'s turn! Click the dice to roll.`);
}

function handleCanvasClick(e) {
    // Calculate position relative to canvas
    const rect = bgCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Only proceed if not currently animating
    if (currentBoard.animating) {
        return;
    }
    
    // Only allow dot selection after dice is rolled
    if (!currentBoard.diceRolled) {
        updateGameInfo(`${currentBoard.players[currentBoard.currentPlayerIndex].name} must roll the dice first!`);
        return;
    }
    
    const player = currentBoard.players[currentBoard.currentPlayerIndex];
    const moveAmount = player.die; // Use stored roll result
    const playerCanvas = player.display;
    
    // Check each dot of current player
    for (let i = 0; i < playerCanvas.dots.length; i++) {
        const dot = playerCanvas.dots[i];
        
        // Check if we clicked on this dot
        let dotClicked = false;
        
        if (dot.inStartingArea) {
            // Check if dot in starting area was clicked
            const dotPos = dot.startPosition;
            const dx = x - dotPos.x;
            const dy = y - dotPos.y;
            dotClicked = (dx * dx + dy * dy) <= (dot.radius * dot.radius);
            
            if (dotClicked) {
                moveDotOutOfStartingArea(player, i, moveAmount);
                return;
            }
        } else if (dot.inHomePath) {
            // Check if dot in home path was clicked
            const dx = x - dot.homePathPosition.x;
            const dy = y - dot.homePathPosition.y;
            dotClicked = (dx * dx + dy * dy) <= (dot.radius * dot.radius);
            
            if (dotClicked) {
                moveDotAlongHomePath(player, i, moveAmount);
                return;
            }
        } else {
            // Check if dot on main path was clicked
            dotClicked = isPointInDot(x, y, dot);
            
            if (dotClicked) {
                moveDotAlongMainPath(player, i, moveAmount);
                return;
            }
        }
    }
}

function handleSetupClick(e) {
    console.debug('handleSetupClick');
    // Calculate position relative to canvas
    const rect = bgCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Check if clicked on dots
    for (let i = 0; i < currentBoard.numPlayers; i++) {
        const pc = currentBoard.players[i].display;
        for (let j = 0; j < pc.dots.length; j++) {
            const dot = pc.dots[j];
            if (isPointInDot(x, y, dot)) {
                // Show selection menu
                showPawnSelectionMenu(currentBoard.players[i]);
                return;
            }
        }
    }
    // Check if clicked on homes
    const boardCenter = { x: bgCanvas.width / 2, y: bgCanvas.height / 2 };
    for (let i = 0; i < currentBoard.numPlayers; i++) {
        const player = currentBoard.players[i];
        const pivotIndex = player.outputIndex;
        const pivotPoint = pathPoints[pivotIndex];
        const canvasPivot = pathToCanvas(pivotPoint);
        const ratio = currentBoard.homeLayerLength / (currentBoard.homeLayerLength+1);
        const homePosition = {
            x: canvasPivot.x + (boardCenter.x - canvasPivot.x) * ratio,
            y: canvasPivot.y + (boardCenter.y - canvasPivot.y) * ratio
        };
        const dx = x - homePosition.x;
        const dy = y - homePosition.y;
        if ((dx * dx + dy * dy) <= (player.display.dots[0].radius ** 2)) {
            player.home = getRandomHome(player.home);
            drawPlayerDots(player);
            drawCurves();
            return;
        }
    }
}

function showPawnSelectionMenu(player) {
    const selectionMenu = document.createElement('div');
    selectionMenu.style.position = 'absolute';
    selectionMenu.style.top = '50%';
    selectionMenu.style.left = '50%';
    selectionMenu.style.transform = 'translate(-50%, -50%)';
    selectionMenu.style.backgroundColor = "black";
    selectionMenu.style.border = '1px solid black';
    selectionMenu.style.padding = '10px';
    selectionMenu.style.zIndex = '1000';
    selectionMenu.style.width = '100vh';
    selectionMenu.style.height = '100vh';
    selectionMenu.style.borderRadius = '50%';
    selectionMenu.style.display = 'flex';
    selectionMenu.style.flexWrap = 'wrap';
    selectionMenu.style.justifyContent = 'center';
    selectionMenu.style.alignItems = 'center';
    selectionMenu.id = 'pawn-selection-menu';

    const pawns = getAllPawns();
    pawns.forEach((pawn, index) => {
        const angle = Math.sqrt(1 + index) * 200;
        const pawnButton = document.createElement('button');
        pawnButton.textContent = pawn;
        pawnButton.style.position = 'absolute';
        pawnButton.style.transform = `rotate(${angle}deg) translate(${2.6 * baseUnit * Math.sqrt(1 + index)}px) rotate(-${angle}deg)`;
        pawnButton.style.fontSize = 3 * baseUnit + 'px';
        pawnButton.style.borderRadius = '50%';
        pawnButton.style.cursor = 'pointer';
        pawnButton.addEventListener('click', () => {
            player.name = pawn;
            drawPlayerDots(player);
            updateScoreBoard();
            removePawnSelectionMenu();
        });
        selectionMenu.appendChild(pawnButton);
    });

    document.body.appendChild(selectionMenu);
    setGameControlsEnabled(false);
}

function removePawnSelectionMenu() {
    const selectionMenu = document.getElementById('pawn-selection-menu');
    selectionMenu && document.body.removeChild(selectionMenu);
    setGameControlsEnabled(true);
}

function updateDiceLocation(resetFace) {
    const diceElement = document.getElementById('dice-container');
    const playerIndex = currentBoard.currentPlayerIndex;
    const player = currentBoard.players[playerIndex]
    if (diceElement) {        
        resetFace && (diceElement.textContent = '🎲');
        resetFace && (diceElement.style.fontSize = 5.2 * baseUnit + 'px');
        diceElement.style.boxShadow = `0 0 10px ${player.color}`;
        diceElement.style.backgroundColor = player.color.alpha(0.2);
        const pivotIndex = player.outputIndex;
        const pivotPoint = pathPoints[pivotIndex];
        // set die position
        const factor = 1.25;
        const canvasPivot = pathToCanvas({x: pivotPoint.x*factor, y: pivotPoint.y*factor});
        // snap position to edge of canvas
        canvasPivot.x < bgCanvas.width/2 && (canvasPivot.x = diceElement.offsetWidth);
        canvasPivot.x >= bgCanvas.width/2 && (canvasPivot.x = bgCanvas.width - diceElement.offsetWidth);
        canvasPivot.y = Math.min(Math.max(diceElement.offsetHeight, canvasPivot.y), bgCanvas.height-diceElement.offsetHeight)
        // place die
        diceElement.style.left = `${canvasPivot.x - diceElement.offsetWidth / 2}px`;
        diceElement.style.top = `${canvasPivot.y - diceElement.offsetHeight / 2}px`;
    }
}

// Move to next player's turn
function nextTurn() {
    updateScoreBoard();
    // remove auto button if last player
    const autoButton = document.getElementById('auto-container');
    currentBoard.diceRolled && currentBoard.currentPlayerIndex == currentBoard.numPlayers - 1 && (autoButton.style.display = 'none');
    
    // Increment turn count for the player who just moved
    currentBoard.turnsHistory[currentBoard.currentPlayerIndex]++;

    // Check if the game should be counted as started
    if (!currentBoard.gameCountedAsStarted
        && Math.min(...currentBoard.turnsHistory) >= 2 * currentBoard.numPlayers
        && currentBoard.players.some(p => !p.autoMove)) {
        markGameStarted();
        currentBoard.gameCountedAsStarted = true;
    }

    // Move to next player
    (currentBoard.dieSize === currentBoard.players[currentBoard.currentPlayerIndex].die) || currentBoard.extraTurn || (playSound('turn'), currentBoard.currentPlayerIndex++);
    currentBoard.currentPlayerIndex = currentBoard.currentPlayerIndex % currentBoard.numPlayers;
    currentBoard.diceRolled = false; // Reset dice rolled state
    currentBoard.players[currentBoard.currentPlayerIndex].die = null;    // Clear last roll
    currentBoard.extraTurn = false;  // Reset extra turn state
    console.debug('nextTurn', currentBoard.currentPlayerIndex);

    // Set z-index for all canvases
    currentBoard.players.forEach((pl, index) => {
        pl.display.canvas.style.zIndex = 5 + (index == currentBoard.currentPlayerIndex);
    });

    // Update dice appearance for new player
    updateDiceLocation(true);
    updateGameInfo(`${currentBoard.players[currentBoard.currentPlayerIndex].name}'s turn! Click the dice to roll.`);

    // Check if the current player is an autoMover
    if (currentBoard.players[currentBoard.currentPlayerIndex].autoMove) {
        handleDiceClick();
    }
}


window.onload = function() {
    // Initialize the game
    calcPathPoints();
    initGame();
    resetGame();

    // Force a resize to ensure everything is sized correctly
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);
};


// version checker
async function checkVersion() {
    const localCommit = document.body.getAttribute("data-commit");

    // Skip verification if running locally or placeholder hasn't been replaced
    if (!localCommit || localCommit === "LATEST_COMMIT_SHA") return;

    const owner = "AmitRotem";
    const repo = "cLudo";
    const url = `https://api.github.com/repos/${owner}/${repo}/commits/main?t=${Date.now()}`;
    try {
    const response = await fetch(url);
    if (!response.ok) return;

    const data = await response.json();
    const remoteCommit = data.sha;

    // Compare the first 7 characters of the SHA hash
    if (localCommit.substring(0, 7) !== remoteCommit.substring(0, 7)) {
        // Notify the player! You can replace this alert with a nice UI banner later
        alert("A new update for Ludo is available! The page will reload.");
        window.location.reload();
    }
    } catch (e) {
        console.error("Version check failed", e);
    } finally {
        console.debug("Version check complete");
    }
}

// Run the check 3 seconds after loading
setTimeout(checkVersion, 3000);
