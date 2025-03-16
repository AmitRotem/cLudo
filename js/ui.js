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
    controlsContainer.style.flexDirection = 'row';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.zIndex = '100';
    container.appendChild(controlsContainer);

    const playerCountDisplay = document.createElement('div');
    playerCountDisplay.style.fontSize = `${baseUnit * 2}px`;
    playerCountDisplay.style.fontWeight = 'bold';
    playerCountDisplay.style.marginRight = `${baseUnit * 0.8}px`;
    playerCountDisplay.style.color = '#333';
    playerCountDisplay.textContent = currentBoard.numPlayers.toString();
    controlsContainer.appendChild(playerCountDisplay);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    controlsContainer.appendChild(buttonContainer);

    const upButton = document.createElement('button');
    upButton.textContent = '▲';
    upButton.style.width = `${baseUnit * 2.5}px`;
    upButton.style.height = `${baseUnit * 2.5}px`;
    upButton.style.fontSize = `${baseUnit * 1}px`;
    upButton.style.marginBottom = `${baseUnit * 0.3}px`;
    upButton.style.cursor = 'pointer';
    upButton.style.backgroundColor = 'hsl(122, 39%, 49%)'; // up button color
    upButton.style.color = 'white';
    upButton.style.border = 'none';
    upButton.style.borderRadius = `${baseUnit * 0.5}px`;
    buttonContainer.appendChild(upButton);

    const downButton = document.createElement('button');
    downButton.textContent = '▼';
    downButton.style.width = `${baseUnit * 2.5}px`;
    downButton.style.height = `${baseUnit * 2.5}px`;
    downButton.style.fontSize = `${baseUnit * 1}px`;
    downButton.style.cursor = 'pointer';
    downButton.style.backgroundColor = 'hsl(4, 90%, 58%)'; // down button color
    downButton.style.color = 'white';
    downButton.style.border = 'none';
    downButton.style.borderRadius = `${baseUnit * 0.5}px`;
    buttonContainer.appendChild(downButton);

    upButton.addEventListener('click', () => {
        console.debug('up button clicked');
        if (currentBoard.numPlayers < 10) {
            currentBoard.numPlayers++;
        }
        playerCountDisplay.textContent = currentBoard.numPlayers.toString();
        resetGame();
    });

    downButton.addEventListener('click', () => {
        console.debug('down button clicked');
        if (currentBoard.numPlayers > 1) {
            currentBoard.numPlayers--;
        }
        playerCountDisplay.textContent = currentBoard.numPlayers.toString();
        resetGame();
    });

    playerControls = {
        container: controlsContainer,
        display: playerCountDisplay,
        upButton: upButton,
        downButton: downButton
    };

    // Add autoMover button
    createAutoButton();
}
let playerControls;

function createDiceElement() {
    const diceContainer = document.createElement('div');
    diceContainer.id = 'dice-container';
    diceContainer.style.position = 'absolute';
    diceContainer.style.backgroundColor = 'hsla(0, 0%, 50%, 0.10)'; // dice background color
    diceContainer.style.width = `${baseUnit * 6}px`;
    diceContainer.style.height = `${baseUnit * 6}px`;
    // diceContainer.style.top = `${baseUnit * 6}px`;
    // diceContainer.style.left = `${baseUnit * 6}px`;
    diceContainer.style.fontSize = `${baseUnit * 5.2}px`;
    diceContainer.style.borderRadius = `${baseUnit * 0.8}px`;
    diceContainer.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
    diceContainer.style.display = 'flex';
    diceContainer.style.justifyContent = 'center';
    diceContainer.style.alignItems = 'center';
    diceContainer.style.cursor = 'pointer';
    diceContainer.style.zIndex = '200';
    diceContainer.style.transition = 'transform 0.1s ease';
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
            canvasPoint = {
                x: dot.startPositions[dot.startingPosition].x,
                y: dot.startPositions[dot.startingPosition].y
            };
        } else if (dot.inHomePath) {
            canvasPoint = dot.homePathPosition;
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
        playerCanvas.ctx.font = `${2.5 * baseUnit}px Arial`; // change emoji size
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
        dotPosX = dot.startPositions[dot.startingPosition].x;
        dotPosY = dot.startPositions[dot.startingPosition].y;
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
    currentBoard = createBoard(currentBoard.numPlayers);
    
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
        currentBoard.players[currentBoard.currentPlayerIndex].style = "Naive";
        console.log(`Player ${currentBoard.currentPlayerIndex} is now an auto mover`);
        handleDiceClick();
    });
    container.appendChild(autoButton);
}

