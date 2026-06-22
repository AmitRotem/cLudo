
// Function to update the scoreboard
function updateScoreBoard() {
    const scores = calcScore();
    let scoreText = '<br><br>Scores:<br>';
    currentBoard.players.forEach((player, index) => {
        // make colored square then the player emoji name
        color_box = `<span style="display:inline-block; width: 1em; height: 1em; background-color: ${player.color}; margin-right: 0.5em;"></span>`;
        scoreText += color_box;
        scoreText += `<span style="font-family: 'Noto Color Emoji', sans-serif;">`;
        scoreText += player.name;
        scoreText += `</span> : `
        scoreText += scores[index]
        if (currentBoard.players[index].autoMove) {
            sufix = "  "
            const NaE = ['😇']; // 🙃😊
            const AnE = ['😈','👿'];
            const NiE = ['🤔']; // 😏😎
            const CrE = ['🤪'];
            if ("Naive" == currentBoard.players[index].style) {sufix+=NaE[Math.floor(NaE.length * Math.random())]};
            if ("Angry" == currentBoard.players[index].style) {sufix+=AnE[Math.floor(AnE.length * Math.random())]};
            if ("Nice"  == currentBoard.players[index].style) {sufix+=NiE[Math.floor(NiE.length * Math.random())]};
            if ("Crazy" == currentBoard.players[index].style) {sufix+=CrE[Math.floor(CrE.length * Math.random())]};
            // if ("Human" == currentBoard.players[index].style) {sufix+='🙂'};
            scoreText += sufix
        }
        scoreText += `<br>`;
        console.debug(`${player.name} dice history: ${player.diceHistory}`)
    });
    scoreBoard.innerHTML = scoreText;
}


function calcPathPoints() {
    // sample path from 0 to sideLength+0.5; that is from pivot (at 0) to mid point to next pivot (at currentBoard.layerLength)
    const sideLength = ( currentBoard.layerLength - 1 ) / 2;
    const factor = 0.5*currentBoard.layerLength/(sideLength*resParameter);
    segmentPoints = Array.from({ length: sideLength*resParameter+1 }, (_, i) => path(i*factor));

    // calculate segment distances
    segmentDiffs = [0];
    for (let i = 0; i < segmentPoints.length - 1; i++) {
        const dx = segmentPoints[i + 1].x - segmentPoints[i].x;
        const dy = segmentPoints[i + 1].y - segmentPoints[i].y;
        segmentDiffs.push(Math.sqrt(dx * dx + dy * dy));
    }

    // Recalculate cumulative distances and path points
    // sideLength+1 points with equalize distances from 0 to sideLength+0.5
    cumulativeDistances = cumsum(segmentDiffs);
    cumulativeDistances = cumulativeDistances.map(x => x*(sideLength + 1)/cumulativeDistances.slice(-1))
    pathIndex = [];
    for (let i = 0; i <= sideLength+1; i++) {
        let targetDistance = i ;
        let index = cumulativeDistances.findIndex(distance => distance >= targetDistance);
        pathIndex.push(index*factor);
    }
    pathIndex.pop(); // last point is at sideLength+0.5 and is not needed
    
    // Add the reverse path, to the next pivot
    // slice to create a copy of the array
    pathIndex = pathIndex.concat(pathIndex.slice().reverse().map(x => (2*sideLength+1) - x));
    pathIndex.pop(); // remove the last point, which is the pivot
    
    // now iterate for each player
    pathPoints = [];
    for (let j = 0; j < currentBoard.numPlayers; j++) {
        pathPoints = pathPoints.concat(pathIndex.map(index => path(index + j*(2*sideLength+1))));
    }
    return pathPoints;
}


// Convert path coordinates to canvas coordinates
function pathToCanvasX(x) {return +x * (bgCanvas.width  / 8) + bgCanvas.width  / 2}
function pathToCanvasY(y) {return -y * (bgCanvas.height / 6) + bgCanvas.height / 2}
function pathToCanvas(pathPoint) {
    return {
        x: pathToCanvasX(pathPoint.x),
        y: pathToCanvasY(pathPoint.y)
    };
}

// Draw the static curves on the background canvas
function drawCurves(maxT = currentBoard.circuitLength) {
    // Clear canvas
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    // Draw outer parallel curve with adjusted transparency and width
    bgCtx.beginPath();
    bgCtx.strokeStyle = 'rgba(255, 102, 0, 0.4)'; // outer path color
    bgCtx.lineWidth = baseUnit * 0.2; // Scale line width with baseUnit
    const gridRadius = currentBoard.boardRadius * 2 * baseUnit / Math.sqrt(currentBoard.numPlayers); // Use baseUnit for scaling
    
    for (let t = 0; t <= 1; t += 0.001) {
        const { x, y } = path(t*maxT);
        
        const delta = 0.001;
        const ahead = path((t + delta)*maxT);
        
        const dx = ahead.x - x;
        const dy = ahead.y - y;
        
        const length = Math.sqrt(dx * dx + dy * dy);
        const nx = dy / length;
        const ny = dx / length;
        
        const offsetX = pathToCanvasX(x) - nx * gridRadius;
        const offsetY = pathToCanvasY(y) - ny * gridRadius;
        
        if (t === 0) {
            bgCtx.moveTo(offsetX, offsetY);
        } else {
            bgCtx.lineTo(offsetX, offsetY);
        }
    }
    bgCtx.stroke();
    
    // Draw inner parallel curve
    bgCtx.beginPath();
    bgCtx.strokeStyle = 'rgba(38, 201, 255, 0.4)'; // inner path color
    bgCtx.lineWidth = baseUnit * 0.2; // Scale line width
    
    for (let t = 0; t <= 1; t += 0.001) {
        const { x, y } = path(t*maxT);
        
        const delta = 0.001;
        const ahead = path((t + delta)*maxT);
        
        const dx = ahead.x - x;
        const dy = ahead.y - y;
        
        const length = Math.sqrt(dx * dx + dy * dy);
        const nx = dy / length;
        const ny = dx / length;
        
        const offsetX = pathToCanvasX(x) + nx * gridRadius;
        const offsetY = pathToCanvasY(y) + ny * gridRadius;
        
        if (t === 0) {
            bgCtx.moveTo(offsetX, offsetY);
        } else {
            bgCtx.lineTo(offsetX, offsetY);
        }
    }
    bgCtx.stroke();
    
    // Draw position indicators for each point in pathPoints
    pathPoints.forEach((point, index) => {
        const canvasPoint = pathToCanvas(point);
        const playerIndex = Math.floor(index / currentBoard.layerLength);
        const startColor = getPlayerColor(playerIndex);
        // Draw circle at each step position with scaled radius
        bgCtx.strokeStyle = '#666666'; // outer circle color
        bgCtx.lineWidth = baseUnit * 0.1;
        bgCtx.beginPath();
        bgCtx.arc(canvasPoint.x, canvasPoint.y, gridRadius, 0, Math.PI * 2);
        bgCtx.stroke();

        bgCtx.lineWidth = 2;
        bgCtx.font = 2 * gridRadius + 'px Arial';
        // bgCtx.font = `${2 * gridRadius}px 'Noto Color Emoji', sans-serif`
        bgCtx.textAlign = 'center';
        bgCtx.textBaseline = 'middle';
        bgCtx.fillStyle = getPlayerColor(index/pathPoints.length*currentBoard.numPlayers, 0.6, currentBoard.numPlayers); // main path color
        bgCtx.fill();
        bgCtx.fillStyle = 'black'; // Reset color for text
        // Style the circle based on position
        if ((index - 2) % (currentBoard.layerLength) == 0) {
            bgCtx.fillStyle = startColor;
            bgCtx.fill();
            bgCtx.fillStyle = 'black'; // Reset color for text
            bgCtx.fillText(getRandomStar(), canvasPoint.x, canvasPoint.y);
        } else if ((index + 3) % (currentBoard.layerLength) == 0) {
            bgCtx.fillText(getRandomStar(), canvasPoint.x, canvasPoint.y);
        }

        if ((index - 2) % (currentBoard.layerLength) == 0) {
            // Player starting position - add circles outside in a square formation
            const arcRadius = gridRadius * 3;
            // Draw starting area with circles in a square pattern
            const positions = Array.from({ length: currentBoard.numBosons }, (_,i) => ({
                x: canvasPoint.x - Math.cos(phaseFactor(playerIndex, currentBoard.numPlayers)) * arcRadius * (1 - Math.cos((i+1) / 5 * Math.PI)) - Math.sin(phaseFactor(playerIndex, currentBoard.numPlayers)) * arcRadius * Math.sin((i+1) / 5 * Math.PI),
                y: canvasPoint.y - Math.sin(phaseFactor(playerIndex, currentBoard.numPlayers)) * arcRadius * (1 - Math.cos((i+1) / 5 * Math.PI)) + Math.cos(phaseFactor(playerIndex, currentBoard.numPlayers)) * arcRadius * Math.sin((i+1) / 5 * Math.PI)
            }));
            
            // Draw the four starting circles
            positions.forEach((pos, idx) => {
                bgCtx.beginPath();
                bgCtx.arc(pos.x, pos.y, gridRadius, 0, Math.PI * 2);
                bgCtx.fillStyle = startColor;
                bgCtx.fill();
                bgCtx.strokeStyle = '#666666'; // outer circle color
                bgCtx.stroke();
                
                // Add player emoji to these circles
                bgCtx.fillStyle = 'white';
                // bgCtx.fillText(players[playerIndex % players.length].name, pos.x, pos.y);
            });
        }
        
        // pivot location
        if (index % (currentBoard.layerLength) == 0) {
            bgCtx.fillStyle = 'black';
            bgCtx.textAlign = 'center';
            bgCtx.textBaseline = 'middle';
            // bgCtx.fillText(index.toString(), canvasPoint.x, canvasPoint.y);
            bgCtx.save();
            bgCtx.translate(canvasPoint.x, canvasPoint.y);
            bgCtx.rotate(((currentBoard.numPlayers % 2 == 0 ? 0.5 : 0.75) + index/(currentBoard.layerLength)) * 2 * Math.PI / currentBoard.numPlayers - Math.PI / 2);
            bgCtx.fillText(getRandomArrow(), 0, 0);
            bgCtx.restore();

            // Add home path - `currentBoard.homeLayerLength-1` circles toward center
            const boardCenter = { x: bgCanvas.width / 2, y: bgCanvas.height / 2 };
            const playerIndex = Math.floor(index / (currentBoard.layerLength));
            const homeColor = getPlayerColor(playerIndex, 0.02);
            
            // Draw path to center
            for (let i = 1; i <= currentBoard.homeLayerLength; i++) {
                const ratio = i / (currentBoard.homeLayerLength+1); // Divide distance into `currentBoard.homeLayerLength+1` parts (1/(currentBoard.homeLayerLength+1), ... currentBoard.homeLayerLength/(currentBoard.homeLayerLength+1))
                const homeX = canvasPoint.x + (boardCenter.x - canvasPoint.x) * ratio;
                const homeY = canvasPoint.y + (boardCenter.y - canvasPoint.y) * ratio;
                
                // Draw home circle
                bgCtx.beginPath();
                bgCtx.arc(homeX, homeY, gridRadius*(i==currentBoard.homeLayerLength ? 0 : 1), 0, Math.PI * 2);
                bgCtx.strokeStyle = '#888888'; // outer circle color
                bgCtx.stroke();
                bgCtx.fillStyle = homeColor;
                bgCtx.fill();
                
                // Add number or icon to the last circle (home)
                if (i == currentBoard.homeLayerLength) {
                    bgCtx.fillStyle = 'white';
                    bgCtx.fillText(currentBoard.players[playerIndex].home, homeX, homeY);
                }
            }
        }
    });
}


// Function to update all dimensions based on viewport
function updateDimensions() {
    // Get actual viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Determine limiting dimension and calculate scale
    if (viewportWidth / viewportHeight > aspectRatio) {
        // Height limited
        scale = viewportHeight;
        bgCanvas.width = viewportHeight * aspectRatio;
        bgCanvas.height = viewportHeight;
    } else {
        // Width limited
        scale = viewportWidth;
        bgCanvas.width = viewportWidth;
        bgCanvas.height = viewportWidth / aspectRatio;
    }
    
    // Force integer dimensions
    bgCanvas.width = Math.round(bgCanvas.width);
    bgCanvas.height = Math.round(bgCanvas.height);
    
    // IMPORTANT: First set the canvas size
    bgCanvas.setAttribute('width', bgCanvas.width);
    bgCanvas.setAttribute('height', bgCanvas.height);
    
    // Then set the style dimensions
    bgCanvas.style.width = `${bgCanvas.width}px`;
    bgCanvas.style.height = `${bgCanvas.height}px`;
    
    // Update container dimensions
    container.style.width = `${bgCanvas.width}px`;
    container.style.height = `${bgCanvas.height}px`;
    
    // Update all player canvases
    currentBoard.players.forEach(player => {
        const pc = player.display;
        pc.canvas.width = bgCanvas.width;
        pc.canvas.height = bgCanvas.height;
        pc.canvas.style.width = `${bgCanvas.width}px`;
        pc.canvas.style.height = `${bgCanvas.height}px`;
    });
    
    // Update base unit for relative positioning
    baseUnit = Math.min(bgCanvas.width, bgCanvas.height) / 60;
    
    // Position gameInfo at bottom right
    gameInfo.style.position = 'absolute';
    gameInfo.style.bottom = `0px`;
    gameInfo.style.left = `0px`;
    gameInfo.style.top = 'auto';
    gameInfo.style.width = 'auto';
    gameInfo.style.maxWidth = '100%';
    gameInfo.style.textAlign = 'left';
    gameInfo.style.fontSize = 1.6 * baseUnit + 'px';
    gameInfo.style.padding = 0.5 * baseUnit + 'px ' + baseUnit + 'px';
    gameInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.2)'; // game info background color
    gameInfo.style.borderRadius = `${baseUnit * 0.5}px`;
    
    // Update all dots with new radius
    currentBoard.players.forEach(player => {
        player.display.dots.forEach(dot => {
            dot.radius = currentBoard.boardRadius * 2 * baseUnit / Math.sqrt(currentBoard.numPlayers);
        });
    });
    
    // Redraw everything with new dimensions
    drawCurves();
    currentBoard.players.forEach(player => drawPlayerDots(player)); // drawPlayerDots can take optional shiftX, shiftY arguments
    
    // Add this to your updateDimensions function
    if (playerControls) {
        // Update controls position and size
        playerControls.container.style.top = 0.8 * baseUnit + 'px';
        playerControls.container.style.right = 0.8 * baseUnit + 'px';
        playerControls.playerCountDisplay.style.fontSize = 2 * baseUnit + 'px';
        playerControls.upPlayerButton.style.width = 2.5 * baseUnit + 'px';
        playerControls.upPlayerButton.style.height = 2.5 * baseUnit + 'px';
        playerControls.downPlayerButton.style.width = 2.5 * baseUnit + 'px';
        playerControls.downPlayerButton.style.height = 2.5 * baseUnit + 'px';
        playerControls.bosonCountDisplay.style.fontSize = 2 * baseUnit + 'px';
        playerControls.upBosonButton.style.width = 2.5 * baseUnit + 'px';
        playerControls.upBosonButton.style.height = 2.5 * baseUnit + 'px';
        playerControls.downBosonButton.style.width = 2.5 * baseUnit + 'px';
        playerControls.downBosonButton.style.height = 2.5 * baseUnit + 'px';
    }

    // Update dice size if it exists
    const diceElement = document.getElementById('dice-container');
    if (diceElement) {
        diceElement.style.width = 6 * baseUnit + 'px';
        diceElement.style.height = 6 * baseUnit + 'px';
        // diceElement.style.top = 6 * baseUnit + 'px';
        // diceElement.style.left = 6 * baseUnit + 'px';
        diceElement.style.fontSize = 5.2 * baseUnit + 'px';
        diceElement.style.borderRadius = 0.8 * baseUnit + 'px';
    }
    updateDiceLocation(false);
}

// Update dot radius, stroke width, and other visual elements
function updateVisualElements() {
    // Scale everything with baseUnit
    currentBoard.players.forEach(player => {
        const pc = player.display;
        pc.dots.forEach((dot, dotIndex) => {
            dot.radius = currentBoard.boardRadius * 2 * baseUnit / Math.sqrt(currentBoard.numPlayers); // Smaller than grid circles

            // Recalculate dot positions after resize
            if (dot.inStartingArea) {
                // Recalculate starting positions
                const pathStartingIndex = (currentBoard.players.indexOf(player) * (currentBoard.layerLength)) + 2;
                const startPathPoint = pathPoints[pathStartingIndex];
                const startCanvasPoint = pathToCanvas(startPathPoint);
                
                const arcRadius = currentBoard.boardRadius * 2 * baseUnit / Math.sqrt(currentBoard.numPlayers) * 3;
                const playerIndex = currentBoard.players.indexOf(player);
                
                dot.startPosition = {
                    x: startCanvasPoint.x - Math.cos(phaseFactor(playerIndex, currentBoard.numPlayers)) * arcRadius * (1 - Math.cos((dotIndex+1) / 5 * Math.PI)) - Math.sin(phaseFactor(playerIndex, currentBoard.numPlayers)) * arcRadius * Math.sin((dotIndex+1) / 5 * Math.PI),
                    y: startCanvasPoint.y - Math.sin(phaseFactor(playerIndex, currentBoard.numPlayers)) * arcRadius * (1 - Math.cos((dotIndex+1) / 5 * Math.PI)) + Math.cos(phaseFactor(playerIndex, currentBoard.numPlayers)) * arcRadius * Math.sin((dotIndex+1) / 5 * Math.PI)
                };
            } else if (dot.inHomePath) {
                // Recalculate home path positions
                const playerIndex = currentBoard.players.indexOf(player);
                const pivotIndex = player.outputIndex;
                const pivotPoint = pathPoints[pivotIndex]; 
                const boardCenter = { x: bgCanvas.width / 2, y: bgCanvas.height / 2 };
                const canvasPivot = pathToCanvas(pivotPoint);
                
                // Calculate position based on current home path step
                const ratio = dot.homePathStep / (currentBoard.homeLayerLength + 1);
                dot.homePathPosition = {
                    x: canvasPivot.x + (boardCenter.x - canvasPivot.x) * ratio,
                    y: canvasPivot.y + (boardCenter.y - canvasPivot.y) * ratio
                };
            }
            // Normal path dots will be correctly positioned by pathToCanvas
        });
    });
    
    // Update the title size and position
    gameTitle.style.fontSize = 3.6 * baseUnit + 'px';
    gameTitle.style.top = 2 * baseUnit + 'px';
}


// Create canvas for each player
currentBoard.players.forEach(player => {
    const canvas = document.createElement('canvas');
    // canvas.width = 3200;
    // canvas.height = 2400;
    canvas.style.position = 'absolute';
    canvas.style.pointerEvents = 'none'; // Make transparent to mouse events at first
    container.appendChild(canvas);
    player.display = {
        player: player,
        canvas: canvas,
        ctx: canvas.getContext('2d'),
        dots: [] // Will store dot positions for this player
    };
});



function initializeDots() {
    currentBoard.players.forEach((player, playerIndex) => {
        const playerCanvas = player.display;
        playerCanvas.dots = [];
        
        // Create dots in starting positions
        for (let i = 0; i < currentBoard.numBosons; i++) {
            playerCanvas.dots.push({
                inStartingArea: true,
                inHomePath: false,
                homePathStep: 0,
                startPosition: {x:0, y:0},
                startIndex: -i-1,
                index: -i-1,
                moving: false,
                targetIndex: -i-1,
                radius: baseUnit
            });
        }
        
        drawPlayerDots(player);
    });
}

// Add window resize listener
window.addEventListener('resize', () => {
    updateDimensions();
    updateVisualElements();
    currentBoard.players.forEach(player => drawPlayerDots(player));
});
