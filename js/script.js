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
    
    // Clear any previous state
    playerCanvases.forEach(pc => {
        pc.dots = [];
        pc.ctx.clearRect(0, 0, pc.canvas.width, pc.canvas.height);
    });
    
    // Draw the curves first
    drawCurves();
    
    // Then initialize dots
    initializeDots();
    
    // Add player controls
    createPlayerControls();
    
    // Create dice element
    createDiceElement();

    // score board
    // updateScoreBoard();
    
    // Set up click handler
    container.onclick = function(e) {
        if (gameState.gameStarted) {
            handleCanvasClick(e);
        } else {
            handleSetupClick(e);
        }
    };
    
    // Make all player canvases non-interactive
    playerCanvases.forEach(pc => {
        pc.canvas.style.pointerEvents = 'none';
    });
    
    // Reset dice state
    gameState.diceRolled = false;
    gameState.lastRoll = null;
    
    updateGameInfo(`${players[gameState.currentPlayerIndex].name}'s turn! Click the dice to roll.`);
    updateGameInfo(`${testDice()}`);
}

function handleCanvasClick(e) {
    // Calculate position relative to canvas
    const rect = bgCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Only proceed if not currently animating
    if (gameState.animating) {
        return;
    }
    
    // Only allow dot selection after dice is rolled
    if (!gameState.diceRolled) {
        updateGameInfo(`${players[gameState.currentPlayerIndex].name} must roll the dice first!`);
        return;
    }
    
    const moveAmount = gameState.lastRoll; // Use stored roll result
    const currentPlayerCanvas = playerCanvases[gameState.currentPlayerIndex];
    
    // Check each dot of current player
    for (let i = 0; i < currentPlayerCanvas.dots.length; i++) {
        const dot = currentPlayerCanvas.dots[i];
        
        // Check if we clicked on this dot
        let dotClicked = false;
        
        if (dot.inStartingArea) {
            // Check if dot in starting area was clicked
            const dotPos = dot.startPositions[dot.startingPosition];
            const dx = x - dotPos.x;
            const dy = y - dotPos.y;
            dotClicked = (dx * dx + dy * dy) <= (dot.radius * dot.radius);
            
            if (dotClicked) {
                moveDotOutOfStartingArea(currentPlayerCanvas, i, moveAmount);
                return;
            }
        } else if (dot.inHomePath) {
            // Check if dot in home path was clicked
            const dx = x - dot.homePathPosition.x;
            const dy = y - dot.homePathPosition.y;
            dotClicked = (dx * dx + dy * dy) <= (dot.radius * dot.radius);
            
            if (dotClicked) {
                moveDotAlongHomePath(currentPlayerCanvas, i, moveAmount);
                return;
            }
        } else {
            // Check if dot on main path was clicked
            dotClicked = isPointInDot(x, y, dot, currentPlayerCanvas);
            
            if (dotClicked) {
                moveDotAlongMainPath(currentPlayerCanvas, i, moveAmount);
                return;
            }
        }
    }
}

function handleSetupClick(e) {
    // Calculate position relative to canvas
    const rect = bgCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Check if clicked on dots
    for (let i = 0; i < playerCanvases.length; i++) {
        const pc = playerCanvases[i];
        for (let j = 0; j < pc.dots.length; j++) {
            const dot = pc.dots[j];
            if (isPointInDot(x, y, dot, pc)) {
                // Change name
                getPlayerNewPawn(i);
                // Redraw the dots
                drawPlayerDots(pc);
                // Update score board
                updateScoreBoard();
                return;
            }
        }
    }

}

function updateDiceLocation(resetFace) {
    const diceElement = document.getElementById('dice-container');
    if (diceElement) {        
        resetFace && (diceElement.textContent = '🎲');
        resetFace && (diceElement.style.fontSize = `${baseUnit * 5.2}px`);
        diceElement.style.boxShadow = `0 0 10px ${players[gameState.currentPlayerIndex].color}`;
        const currentPlayerCanvas = playerCanvases[gameState.currentPlayerIndex];
        const playerIndex = playerCanvases.indexOf(currentPlayerCanvas);
        const pivotIndex = (playerIndex * (sideLength*2+1));
        const pivotPoint = pathPoints[pivotIndex];
        const factor = 1.25;
        const canvasPivot = pathToCanvas({x: pivotPoint.x*factor, y: pivotPoint.y*factor});
        canvasPivot.x < visualViewport.width/2 && (canvasPivot.x = diceElement.offsetWidth);
        canvasPivot.x >= visualViewport.width/2 && (canvasPivot.x = visualViewport.width - diceElement.offsetWidth);
        canvasPivot.y = Math.min(Math.max(diceElement.offsetHeight, canvasPivot.y), visualViewport.height-diceElement.offsetHeight)
        diceElement.style.left = `${canvasPivot.x - diceElement.offsetWidth / 2}px`;
        diceElement.style.top = `${canvasPivot.y - diceElement.offsetHeight / 2}px`;
    }
}

// Move to next player's turn
function nextTurn() {
    // remove auto button if last player
    const autoButton = document.getElementById('auto-container');
    gameState.diceRolled && gameState.currentPlayerIndex == gameState.numberOfPlayers - 1 && (autoButton.style.display = 'none');
    
    // Move to next player
    (gameState.dieFaces === gameState.lastRoll) || gameState.extraTurn || (playSound('turn'), gameState.currentPlayerIndex++);
    gameState.currentPlayerIndex = gameState.currentPlayerIndex % players.length;
    gameState.diceRolled = false; // Reset dice rolled state
    gameState.lastRoll = null;    // Clear last roll
    gameState.extraTurn = false;  // Reset extra turn state
    
    // Set z-index for all canvases
    playerCanvases.forEach((pc, index) => {
        pc.canvas.style.zIndex = 5 + (index == gameState.currentPlayerIndex);
    });

    // Update dice appearance for new player
    updateDiceLocation(true);
    updateGameInfo(`${players[gameState.currentPlayerIndex].name}'s turn! Click the dice to roll.`);

    // Check if the current player is an autoMover
    if (gameState.autoMover[gameState.currentPlayerIndex]) {
        handleDiceClick();
    }
}


window.onload = function() {
    // Initialize the game
    initGame();
    resetGame();
    
    // Force a resize to ensure everything is sized correctly
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);
};
