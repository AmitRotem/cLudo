// Player controls creation
// Dice element creation
// Game info display
// Title and UI elements
function createPlayerControls() {
    const controlsContainer = document.createElement('div');
    controlsContainer.style.position = 'absolute';
    controlsContainer.style.top = `${baseUnit * 0.8}px`;
    controlsContainer.style.right = `${baseUnit * 0.8}px`;
    controlsContainer.style.display = 'flex';
    controlsContainer.style.flexDirection = 'column';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.zIndex = '100';
    container.appendChild(controlsContainer);

    // Player count controls
    const playerCountContainer = document.createElement('div');
    playerCountContainer.style.display = 'flex';
    playerCountContainer.style.flexDirection = 'row';
    playerCountContainer.style.alignItems = 'center';
    playerCountContainer.style.marginBottom = 1.5 * baseUnit + 'px';
    controlsContainer.appendChild(playerCountContainer);

    const playerCountDisplay = document.createElement('div');
    playerCountDisplay.classList.add('background-text');
    playerCountDisplay.style.position = 'relative';
    playerCountDisplay.style.fontSize = 2 * baseUnit + 'px';
    playerCountDisplay.style.fontWeight = 'bold';
    playerCountDisplay.style.marginRight = 0.8 * baseUnit + 'px';
    playerCountDisplay.textContent = currentBoard.numPlayers.toString();
    playerCountContainer.appendChild(playerCountDisplay);

    const playerButtonContainer = document.createElement('div');
    playerButtonContainer.style.display = 'flex';
    playerButtonContainer.style.flexDirection = 'column';
    playerCountContainer.appendChild(playerButtonContainer);

    const upPlayerButton = document.createElement('button');
    upPlayerButton.textContent = '▲';
    upPlayerButton.style.width = 2.5 * baseUnit + 'px';
    upPlayerButton.style.height = 2.5 * baseUnit + 'px';
    upPlayerButton.style.fontSize = baseUnit + 'px';
    upPlayerButton.style.marginBottom = 0.3 * baseUnit + 'px';
    upPlayerButton.style.cursor = 'pointer';
    upPlayerButton.style.backgroundColor = 'hsl(122, 39%, 49%)'; // up button color
    upPlayerButton.style.color = 'white';
    upPlayerButton.style.border = 'none';
    upPlayerButton.style.borderRadius = 0.5 * baseUnit + 'px';
    playerButtonContainer.appendChild(upPlayerButton);

    const downPlayerButton = document.createElement('button');
    downPlayerButton.textContent = '▼';
    downPlayerButton.style.width = 2.5 * baseUnit + 'px';
    downPlayerButton.style.height = 2.5 * baseUnit + 'px';
    downPlayerButton.style.fontSize = 1 * baseUnit + 'px';
    downPlayerButton.style.cursor = 'pointer';
    downPlayerButton.style.backgroundColor = 'hsl(4, 90%, 58%)'; // down button color
    downPlayerButton.style.color = 'white';
    downPlayerButton.style.border = 'none';
    downPlayerButton.style.borderRadius = 0.5 * baseUnit + 'px';
    playerButtonContainer.appendChild(downPlayerButton);

    upPlayerButton.addEventListener('click', () => {
        console.debug('up player button clicked');
        if (currentBoard.numPlayers < 10) {
            currentBoard.numPlayers++;
        }
        playerCountDisplay.textContent = currentBoard.numPlayers.toString();
        resetGame();
    });

    downPlayerButton.addEventListener('click', () => {
        console.debug('down player button clicked');
        if (currentBoard.numPlayers > 1) {
            currentBoard.numPlayers--;
        }
        playerCountDisplay.textContent = currentBoard.numPlayers.toString();
        resetGame();
    });

    // Boson count controls
    const bosonCountContainer = document.createElement('div');
    bosonCountContainer.style.display = 'flex';
    bosonCountContainer.style.flexDirection = 'row';
    bosonCountContainer.style.alignItems = 'center';
    controlsContainer.appendChild(bosonCountContainer);

    const bosonCountDisplay = document.createElement('div');
    bosonCountDisplay.classList.add('background-text');
    bosonCountDisplay.style.position = 'relative';
    bosonCountDisplay.style.fontSize = 2 * baseUnit + 'px';
    bosonCountDisplay.style.fontWeight = 'bold';
    bosonCountDisplay.style.marginRight = 0.8 * baseUnit + 'px';
    bosonCountDisplay.textContent = currentBoard.numBosons.toString();
    bosonCountContainer.appendChild(bosonCountDisplay);

    const bosonButtonContainer = document.createElement('div');
    bosonButtonContainer.style.display = 'flex';
    bosonButtonContainer.style.flexDirection = 'column';
    bosonCountContainer.appendChild(bosonButtonContainer);

    const upBosonButton = document.createElement('button');
    upBosonButton.textContent = '▲';
    upBosonButton.style.width = 2.5 * baseUnit + 'px';
    upBosonButton.style.height = 2.5 * baseUnit + 'px';
    upBosonButton.style.fontSize = 1 * baseUnit + 'px';
    upBosonButton.style.marginBottom = 0.3 * baseUnit + 'px';
    upBosonButton.style.cursor = 'pointer';
    upBosonButton.style.backgroundColor = 'hsl(122, 39%, 49%)'; // up button color
    upBosonButton.style.color = 'white';
    upBosonButton.style.border = 'none';
    upBosonButton.style.borderRadius = 0.5 * baseUnit + 'px';
    bosonButtonContainer.appendChild(upBosonButton);

    const downBosonButton = document.createElement('button');
    downBosonButton.textContent = '▼';
    downBosonButton.style.width = 2.5 * baseUnit + 'px';
    downBosonButton.style.height = 2.5 * baseUnit + 'px';
    downBosonButton.style.fontSize = 1 * baseUnit + 'px';
    downBosonButton.style.cursor = 'pointer';
    downBosonButton.style.backgroundColor = 'hsl(4, 90%, 58%)'; // down button color
    downBosonButton.style.color = 'white';
    downBosonButton.style.border = 'none';
    downBosonButton.style.borderRadius = 0.5 * baseUnit + 'px';
    bosonButtonContainer.appendChild(downBosonButton);

    upBosonButton.addEventListener('click', () => {
        console.debug('up boson button clicked');
        if (currentBoard.numBosons < 9) {
            currentBoard.numBosons++;
        }
        bosonCountDisplay.textContent = currentBoard.numBosons.toString();
        resetGame();
    });

    downBosonButton.addEventListener('click', () => {
        console.debug('down boson button clicked');
        if (currentBoard.numBosons > 1) {
            currentBoard.numBosons--;
        }
        bosonCountDisplay.textContent = currentBoard.numBosons.toString();
        resetGame();
    });

    playerControls = {
        container: controlsContainer,
        playerCountDisplay: playerCountDisplay,
        upPlayerButton: upPlayerButton,
        downPlayerButton: downPlayerButton,
        bosonCountDisplay: bosonCountDisplay,
        upBosonButton: upBosonButton,
        downBosonButton: downBosonButton
    };

    // Add autoMover button
    createAutoButton();
}

function createDiceElement() {
    const diceContainer = document.createElement('div');
    diceContainer.classList.add('dice');
    diceContainer.id = 'dice-container';
    diceContainer.textContent = '🎲';

    diceContainer.addEventListener('mouseover', () => {
        diceContainer.style.transform = 'scale(1.1)';
    });

    diceContainer.addEventListener('mouseout', () => {
        diceContainer.style.transform = 'scale(1)';
    });

    diceContainer.addEventListener('click', handleDiceClick);

    container.appendChild(diceContainer);

    updateDiceLocation(false);

    return diceContainer;
}

function updateGameInfo(message) {
    gameInfo.textContent = message;
    gameInfo.style.color = currentBoard.players[currentBoard.currentPlayerIndex].color;
}

function drawPlayerDots(player, shiftXlist=0, shiftYlist=0) {
    const playerCanvas = player.display;
    playerCanvas.ctx.clearRect(0, 0, player.display.canvas.width, player.display.canvas.height);
    const emoji = player.name;

    playerCanvas.dots.forEach((dot, index) => {
        const shiftX = Array.isArray(shiftXlist) ? shiftXlist[index] : shiftXlist;
        const shiftY = Array.isArray(shiftYlist) ? shiftYlist[index] : shiftYlist;
        let canvasPoint;

        if (dot.inStartingArea) {
            canvasPoint = dot.startPosition;
        } else if (dot.inHomePath) {
            canvasPoint = {
                x: dot.homePathPosition.x + (dot.reachedHome==true) * 2 * baseUnit * Math.cos((0.5 + index) / player.numBosons * 2 * Math.PI),
                y: dot.homePathPosition.y + (dot.reachedHome==true) * 2 * baseUnit * Math.sin((0.5 + index) / player.numBosons * 2 * Math.PI)
            };
        } else if (dot.moving && dot.interpolation !== undefined) {
            canvasPoint = pathToCanvas(dot.interpolation);
        } else {
            canvasPoint = pathToCanvas(pathPoints[dot.index]);
        }

        playerCanvas.ctx.beginPath();
        playerCanvas.ctx.arc(canvasPoint.x+shiftX, canvasPoint.y+shiftY, dot.radius, 0, Math.PI * 2);
        // playerCanvas.ctx.strokeStyle = '#888888';
        // playerCanvas.ctx.stroke();
        player.color.split("(")[0] === "hsl" || error("Color should be in hsl format");
        playerCanvas.ctx.fillStyle = `hsla(${player.color.split("(")[1].split(")")[0]}, 0.3)`; // dot background color
        playerCanvas.ctx.fill();
        playerCanvas.ctx.font = `${2.5 * baseUnit}px 'Noto Color Emoji', sans-serif`; // change emoji size
        playerCanvas.ctx.textAlign = 'center';
        playerCanvas.ctx.textBaseline = 'middle';
        playerCanvas.ctx.fillStyle = 'white';
        playerCanvas.ctx.globalAlpha = 1;
        playerCanvas.ctx.fillText(emoji, canvasPoint.x+shiftX, canvasPoint.y+shiftY);
    });
}

function isPointInDot(x, y, dot) {
    let dotPosX, dotPosY;
    
    if (dot.inStartingArea) {
        // Get position from starting positions
        dotPosX = dot.startPosition.x;
        dotPosY = dot.startPosition.y;
    } else if (dot.inHomePath) {
        // Get position from home path
        dotPosX = dot.homePathPosition.x;
        dotPosY = dot.homePathPosition.y;
    } else {
        // Get position from regular path
        const pathPoint = pathPoints[dot.index];
        const canvasPoint = pathToCanvas(pathPoint);
        dotPosX = canvasPoint.x;
        dotPosY = canvasPoint.y;
    }
    
    const dx = x - dotPosX;
    const dy = y - dotPosY;
    return (dx * dx + dy * dy) <= (dot.radius * dot.radius);
}

// Function to reset the game when player count changes
function resetGame() {
    // Remove pawn selection menu if it exists
    removePawnSelectionMenu();
    // Create new board
    currentBoard = createBoard(currentBoard.numPlayers, {numBosons: currentBoard.numBosons});
    
    // Update canvas references
    while (container.children.length > 1) {
        container.removeChild(container.lastChild);
    }
    
    // Re-add background canvas
    container.appendChild(bgCanvas);

    // Re-add title
    container.appendChild(gameTitle);
    
    // Create new player canvases
    currentBoard.players.forEach(player => {
        const canvas = document.createElement('canvas');
        canvas.width = bgCanvas.width;
        canvas.height = bgCanvas.height;
        canvas.style.position = 'absolute';
        canvas.style.pointerEvents = 'none';
        container.appendChild(canvas);
        player.display = {
            canvas: canvas,
            ctx: canvas.getContext('2d'),
            dots: []
        };
    });

    // Re-add game info
    container.appendChild(gameInfo);
    
    // Re-add and update controls
    createPlayerControls();
    
    // Recalculate path points
    calcPathPoints();
    

    // Redraw everything
    drawCurves();
    initializeDots();
    
    // Remove old dice if it exists
    const oldDice = document.getElementById('dice-container');
    if (oldDice) {
        oldDice.remove();
    }
    
    // Create new dice
    createDiceElement();

    // Re-add score board
    container.appendChild(scoreBoard);
    updateScoreBoard();
    
    // Reset dice state
    currentBoard.diceRolled = false;
    currentBoard.players[currentBoard.currentPlayerIndex].die = null;
    currentBoard.gameStarted = false;
    
    // Reset game info
    updateGameInfo(`${currentBoard.players[currentBoard.currentPlayerIndex].name}'s turn! Click the dice to roll.`);

    // force redraw
    window.dispatchEvent(new Event('resize'));
}

function createAutoButton() {
    const autoButton = document.createElement('button');
    autoButton.id = 'auto-container';
    autoButton.textContent = 'Auto';
    autoButton.style.position = 'absolute';
    autoButton.style.bottom = '10px';
    autoButton.style.right = '10px';
    autoButton.style.padding = '10px 20px';
    autoButton.style.fontSize = '16px';
    autoButton.style.cursor = 'pointer';
    autoButton.style.backgroundColor = 'hsl(211, 100%, 50%)'; // auto button color
    autoButton.style.color = 'white';
    autoButton.style.border = 'none';
    autoButton.style.borderRadius = '5px';
    autoButton.style.zIndex = '100';
    autoButton.style.display = 'block';
    autoButton.addEventListener('click', () => {
        console.debug('Auto button clicked');
        currentBoard.players[currentBoard.currentPlayerIndex].autoMove = true;
        currentBoard.players[currentBoard.currentPlayerIndex].style = ['Naive', 'Angry', 'Nice'][Math.floor(Math.random() * 3)];
        console.log(`Player ${currentBoard.currentPlayerIndex} is now an auto mover`);
        handleDiceClick();
    });
    container.appendChild(autoButton);
}

