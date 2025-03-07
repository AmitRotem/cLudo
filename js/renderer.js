// Canvas initialization
// Board rendering functions
// Path drawing
// Dot/pawn rendering
// Coordinate conversion functions

// Create background canvas for static curves
const bgCanvas = document.createElement('canvas');
const bgCtx = bgCanvas.getContext('2d');
bgCanvas.width = 800;
bgCanvas.height = 600;
bgCanvas.style.border = 'none'; // Remove the border
bgCanvas.style.margin = '0';    // Remove margin
bgCanvas.style.display = 'block';
bgCanvas.style.position = 'absolute';

// Create a container div to hold all canvases
const container = document.createElement('div');
container.style.position = 'relative';
container.style.width = '800px';
container.style.height = '600px';
container.style.margin = '0px auto';
document.body.appendChild(container);

// Add background canvas to container
container.appendChild(bgCanvas);

// Create title overlay on the canvas
const gameTitle = document.createElement('div');
gameTitle.textContent = 'Ludo';
gameTitle.style.position = 'absolute';
gameTitle.style.top = '6px';
gameTitle.style.left = '0';
gameTitle.style.width = '100%';
gameTitle.style.textAlign = 'left';
gameTitle.style.fontSize = '36px';
gameTitle.style.fontWeight = 'bold';
gameTitle.style.color = '#333';
gameTitle.style.textShadow = '2px 2px 4px rgba(255, 255, 255, 0.7)';
gameTitle.style.pointerEvents = 'auto'; // Allow clicks
gameTitle.style.zIndex = '100'; // Ensure it's on top
container.appendChild(gameTitle);

// Add click event to toggle full screen mode
gameTitle.addEventListener('click', () => {
    console.log('Toggling full screen mode');
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
});

// Create UI elements
const gameInfo = document.createElement('div');
// gameInfo.style.position = 'absolute';
// gameInfo.style.top = '61px';
// gameInfo.style.width = '10%';
// gameInfo.style.textAlign = 'left';
// gameInfo.style.fontFamily = 'Arial, sans-serif';
// gameInfo.style.fontSize = '12px';
// gameInfo.style.fontWeight = 'bold';
container.appendChild(gameInfo);

// sample path points
let segmentPoints = Array.from({ length: (sideLength-1)*resParameter+1 }, (_, i) => path(i/resParameter));
// calculate segment distances
let segmentDiffs = [];
for (let i = 0; i < segmentPoints.length - 1; i++) {
    const dx = segmentPoints[i + 1].x - segmentPoints[i].x;
    const dy = segmentPoints[i + 1].y - segmentPoints[i].y;
    // squared distance
    segmentDiffs.push(Math.sqrt(dx * dx + dy * dy));
}
// calculate cumulative distances

let cumulativeDistances = cumsum(segmentDiffs);
let pathIndex = [];
for (let i = 0; i <= sideLength; i++) {
    let targetDistance = i * cumulativeDistances[cumulativeDistances.length - 1] / sideLength;
    let index = cumulativeDistances.findIndex(distance => distance >= targetDistance);
    pathIndex.push(index/resParameter);
}

pathIndex = pathIndex.concat(pathIndex.slice().reverse().map(x => (2*sideLength+1) - x));
pathIndex.pop();
let pathPoints = [];
for (let j = 0; j < gameState.numberOfPlayers; j++) {
    pathPoints = pathPoints.concat(pathIndex.map(index => path(index + j*(2*sideLength+1))));
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
function drawCurves(maxT = gameState.maxT) {
    // Clear canvas
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    // Draw outer parallel curve with adjusted transparency and width
    bgCtx.beginPath();
    bgCtx.strokeStyle = 'rgba(255, 102, 0, 0.4)'; // Increased opacity
    bgCtx.lineWidth = baseUnit * 0.2; // Scale line width with baseUnit
    const gridRadius = 3.5 * baseUnit / Math.sqrt(gameState.numberOfPlayers); // Use baseUnit for scaling
    
    for (let t = 0; t <= 1; t += 0.001) {
        const { x, y } = path(t*maxT);
        
        const delta = 0.001;
        const ahead = path((t + delta)*maxT);
        
        const dx = ahead.x - x;
        const dy = ahead.y - y;
        
        const length = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / length;
        const ny = +dx / length;
        
        const offsetX = pathToCanvasX(+x) + nx * gridRadius;
        const offsetY = pathToCanvasY(-y) + ny * gridRadius;
        
        if (t === 0) {
            bgCtx.moveTo(offsetX, offsetY);
        } else {
            bgCtx.lineTo(offsetX, offsetY);
        }
    }
    bgCtx.stroke();
    
    // Draw inner parallel curve
    bgCtx.beginPath();
    bgCtx.strokeStyle = 'rgba(38, 201, 255, 0.4)'; // Increased opacity
    bgCtx.lineWidth = baseUnit * 0.2; // Scale line width
    
    for (let t = 0; t <= 1; t += 0.001) {
        // Existing inner curve code...
        const { x, y } = path(t*maxT);
        
        const delta = 0.001;
        const ahead = path((t + delta)*maxT);
        
        const dx = ahead.x - x;
        const dy = ahead.y - y;
        
        const length = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / length;
        const ny = dx / length;
        
        const offsetX = pathToCanvasX(+x) - nx * gridRadius;
        const offsetY = pathToCanvasY(-y) - ny * gridRadius;
        
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
        const playerIndex = Math.floor(index / (sideLength*2+1));
        const startColor = getPlayerColor(playerIndex / gameState.numberOfPlayers, 100, 50);
        // Draw circle at each step position with scaled radius
        bgCtx.strokeStyle = '#666666';
        bgCtx.lineWidth = baseUnit * 0.1;
        bgCtx.beginPath();
        bgCtx.arc(canvasPoint.x, canvasPoint.y, gridRadius, 0, Math.PI * 2);
        bgCtx.stroke();

        bgCtx.lineWidth = 2;
        bgCtx.font = `${2 * gridRadius}px Arial`;
        bgCtx.textAlign = 'center';
        bgCtx.textBaseline = 'middle';
        bgCtx.fillStyle = getPlayerColor(index, 100, 98, pathPoints.length);
        bgCtx.fill();
        bgCtx.fillStyle = 'black'; // Reset color for text
        // Style the circle based on position
        if ((index - 2) % (sideLength*2+1) == 0) {
            bgCtx.fillStyle = startColor;
            bgCtx.fill();
            bgCtx.fillStyle = 'black'; // Reset color for text
            bgCtx.fillText(getRandomStar(), canvasPoint.x, canvasPoint.y);
        } else if ((index + 3) % (sideLength*2+1) == 0) {
            bgCtx.fillText(getRandomStar(), canvasPoint.x, canvasPoint.y);
        }

        if ((index - 2) % (sideLength*2+1) == 0) {
            // Player starting position - add circles outside in a square formation
            const arcRadius = gridRadius * 3;
            // Draw starting area with circles in a square pattern
            const positions = Array.from({ length: gameState.dotsPerPlayer }, (_,i) => ({
                x: canvasPoint.x - Math.cos((0.2+(2 == gameState.numberOfPlayers ? -0.5 : 0.0)+playerIndex) / gameState.numberOfPlayers * 2 * Math.PI) * arcRadius * (1 - Math.cos((i+1) / 5 * Math.PI)) - Math.sin((0.2+(2 == gameState.numberOfPlayers ? -0.5 : 0.0)+playerIndex) / gameState.numberOfPlayers * 2 * Math.PI) * arcRadius * Math.sin((i+1) / 5 * Math.PI),
                y: canvasPoint.y - Math.sin((0.2+(2 == gameState.numberOfPlayers ? -0.5 : 0.0)+playerIndex) / gameState.numberOfPlayers * 2 * Math.PI) * arcRadius * (1 - Math.cos((i+1) / 5 * Math.PI)) + Math.cos((0.2+(2 == gameState.numberOfPlayers ? -0.5 : 0.0)+playerIndex) / gameState.numberOfPlayers * 2 * Math.PI) * arcRadius * Math.sin((i+1) / 5 * Math.PI)
            }));
            
            // Draw the four starting circles
            positions.forEach((pos, idx) => {
                bgCtx.beginPath();
                bgCtx.arc(pos.x, pos.y, gridRadius * 0.9, 0, Math.PI * 2);
                bgCtx.fillStyle = startColor;
                bgCtx.fill();
                bgCtx.strokeStyle = '#666666';
                bgCtx.stroke();
                
                // Add player emoji to these circles
                bgCtx.fillStyle = 'white';
                // bgCtx.fillText(players[playerIndex % players.length].name, pos.x, pos.y);
            });
        }
        
        // pivot location
        if (index % (sideLength*2+1) == 0) {
            bgCtx.fillStyle = 'black';
            bgCtx.font = `{2 * gridRadius} Arial`;
            bgCtx.textAlign = 'center';
            bgCtx.textBaseline = 'middle';
            // bgCtx.fillText(index.toString(), canvasPoint.x, canvasPoint.y);
            bgCtx.save();
            bgCtx.translate(canvasPoint.x, canvasPoint.y);
            bgCtx.rotate(((2 == gameState.numberOfPlayers ? 0.25 : -0.5)+(0.5+index/(sideLength * 2 + 1))/gameState.numberOfPlayers) * (2 * Math.PI));
            // ((2 == gameState.numberOfPlayers ? 0 : -0.5) + 0.5 - index / (sideLength * 2 + 1) / gameState.numberOfPlayers)
            bgCtx.fillText(getRandomArrow(), 0, 0);
            bgCtx.restore();

            // Add home path - `gameState.pathToHome-1` circles toward center
            const boardCenter = { x: bgCanvas.width / 2, y: bgCanvas.height / 2 };
            const playerIndex = Math.floor(index / (sideLength*2+1));
            const homeColor = getPlayerColor(playerIndex / gameState.numberOfPlayers, 100, 50);
            
            // Draw path to center
            for (let i = 1; i <= gameState.pathToHome; i++) {
                const ratio = i / (gameState.pathToHome+1); // Divide distance into `gameState.pathToHome+1` parts (1/(gameState.pathToHome+1), ... gameState.pathToHome/(gameState.pathToHome+1))
                const homeX = canvasPoint.x + (boardCenter.x - canvasPoint.x) * ratio;
                const homeY = canvasPoint.y + (boardCenter.y - canvasPoint.y) * ratio;
                
                // Draw home circle
                bgCtx.beginPath();
                bgCtx.arc(homeX, homeY, gridRadius*(i==gameState.pathToHome ? 0 : 1), 0, Math.PI * 2);
                bgCtx.strokeStyle = '#888888';
                bgCtx.stroke();
                bgCtx.fillStyle = homeColor;
                bgCtx.fill();
                
                // Add number or icon to the last circle (home)
                if (i == gameState.pathToHome) {
                    bgCtx.fillStyle = 'white';
                    bgCtx.fillText('🏠', homeX, homeY);
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
    playerCanvases.forEach(pc => {
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
    gameInfo.style.top = 'auto'; // Clear the top value
    gameInfo.style.width = 'auto'; // Don't stretch full width
    gameInfo.style.maxWidth = '100%';
    gameInfo.style.textAlign = 'left';
    gameInfo.style.fontSize = `${baseUnit * 1.6}px`;
    gameInfo.style.padding = `${baseUnit * 0.5}px ${baseUnit}px`;
    // gameInfo.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    gameInfo.style.borderRadius = `${baseUnit * 0.5}px`;
    
    // Update all dots with new radius
    playerCanvases.forEach(pc => {
        pc.dots.forEach(dot => {
            dot.radius = 3 * baseUnit / Math.sqrt(gameState.numberOfPlayers);
        });
    });
    
    // Redraw everything with new dimensions
    drawCurves();
    playerCanvases.forEach(pc => drawPlayerDots(pc)); // drawPlayerDots can take optional shiftX, shiftY arguments
    
    // Add this to your updateDimensions function
    if (gameState.playerControls) {
        // Update controls position and size
        gameState.playerControls.container.style.top = `${baseUnit * 0.8}px`;
        gameState.playerControls.container.style.right = `${baseUnit * 0.8}px`;
        gameState.playerControls.display.style.fontSize = `${baseUnit * 2}px`;
        gameState.playerControls.upButton.style.width = `${baseUnit * 2.5}px`;
        gameState.playerControls.upButton.style.height = `${baseUnit * 2.5}px`;
        gameState.playerControls.downButton.style.width = `${baseUnit * 2.5}px`;
        gameState.playerControls.downButton.style.height = `${baseUnit * 2.5}px`;
    }

    // Update dice size if it exists
    const diceElement = document.getElementById('dice-container');
    if (diceElement) {
        diceElement.style.width = `${baseUnit * 6}px`;
        diceElement.style.height = `${baseUnit * 6}px`;
        // diceElement.style.top = `${baseUnit * 6}px`;
        // diceElement.style.left = `${baseUnit * 6}px`;
        diceElement.style.fontSize = `${baseUnit * 5.2}px`;
        diceElement.style.borderRadius = `${baseUnit * 0.8}px`;
    }
    updateDiceLocation(true);
}

// Update dot radius, stroke width, and other visual elements
function updateVisualElements() {
    // Scale everything with baseUnit
    playerCanvases.forEach(pc => {
        pc.dots.forEach(dot => {
            dot.radius = 3 * baseUnit / Math.sqrt(gameState.numberOfPlayers); // Smaller than grid circles

            // Recalculate dot positions after resize
            if (dot.inStartingArea) {
                // Recalculate starting positions
                const pathStartingIndex = (playerCanvases.indexOf(pc) * (sideLength*2+1)) + 2;
                const startPathPoint = pathPoints[pathStartingIndex];
                const startCanvasPoint = pathToCanvas(startPathPoint);
                
                const arcRadius = 3.5 * baseUnit / Math.sqrt(gameState.numberOfPlayers) * 3;
                const playerIndex = playerCanvases.indexOf(pc);
                
                dot.startPositions = Array.from({ length: gameState.dotsPerPlayer }, (_, i) => ({
                    x: startCanvasPoint.x - Math.cos((0.2+(2 == gameState.numberOfPlayers ? -0.5 : 0.0)+playerIndex) / gameState.numberOfPlayers * 2 * Math.PI) * arcRadius * (1 - Math.cos((i+1) / 5 * Math.PI)) - Math.sin((0.2+(2 == gameState.numberOfPlayers ? -0.5 : 0.0)+playerIndex) / gameState.numberOfPlayers * 2 * Math.PI) * arcRadius * Math.sin((i+1) / 5 * Math.PI),
                    y: startCanvasPoint.y - Math.sin((0.2+(2 == gameState.numberOfPlayers ? -0.5 : 0.0)+playerIndex) / gameState.numberOfPlayers * 2 * Math.PI) * arcRadius * (1 - Math.cos((i+1) / 5 * Math.PI)) + Math.cos((0.2+(2 == gameState.numberOfPlayers ? -0.5 : 0.0)+playerIndex) / gameState.numberOfPlayers * 2 * Math.PI) * arcRadius * Math.sin((i+1) / 5 * Math.PI)
                }));
            } else if (dot.inHomePath) {
                // Recalculate home path positions
                const playerIndex = playerCanvases.indexOf(pc);
                const pivotIndex = (playerIndex * (sideLength*2+1));
                const pivotPoint = pathPoints[pivotIndex]; 
                const boardCenter = { x: bgCanvas.width / 2, y: bgCanvas.height / 2 };
                const canvasPivot = pathToCanvas(pivotPoint);
                
                // Calculate position based on current home path step
                const ratio = (dot.homePathStep || 0) / gameState.pathToHome;
                dot.homePathPosition = {
                    x: canvasPivot.x + (boardCenter.x - canvasPivot.x) * ratio,
                    y: canvasPivot.y + (boardCenter.y - canvasPivot.y) * ratio
                };
            }
            // Normal path dots will be correctly positioned by pathToCanvas
        });
    });
    
    // Also update strokeWidth and other visual parameters
    const strokeWidth = baseUnit * 0.1;
    const fontSize = baseUnit * 1;
    
    // Update the title size and position
    gameTitle.style.fontSize = `${baseUnit * 3.6}px`;
    gameTitle.style.top = `${baseUnit * 2}px`;
}


// Create canvas for each player
const playerCanvases = players.map(player => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.position = 'absolute';
    canvas.style.pointerEvents = 'none'; // Make transparent to mouse events at first
    container.appendChild(canvas);
    return {
        player: player,
        canvas: canvas,
        ctx: canvas.getContext('2d'),
        dots: [] // Will store dot positions for this player
    };
});



function initializeDots() {
    playerCanvases.forEach((playerCanvas, playerIndex) => {
        playerCanvas.dots = [];
        
        // Calculate the starting circle position index
        const pathStartingIndex = (playerIndex * (sideLength*2+1)) + 2;
        
        // Get the pathPoint for this starting position
        const startPathPoint = pathPoints[pathStartingIndex];
        const startCanvasPoint = pathToCanvas(startPathPoint);
        
        // Get the positions of the starting circles
        const arcRadius = 3.5 * baseUnit / Math.sqrt(gameState.numberOfPlayers) * 3;
        const positions = Array.from({ length: gameState.dotsPerPlayer }, (_,i) => ({
            x: startCanvasPoint.x - Math.cos((0.2+(2 == gameState.numberOfPlayers ? -0.5 : 0.0)+playerIndex) / gameState.numberOfPlayers * 2 * Math.PI) * arcRadius * (1 - Math.cos((i+1) / 5 * Math.PI)) - Math.sin((0.2+(2 == gameState.numberOfPlayers ? -0.5 : 0.0)+playerIndex) / gameState.numberOfPlayers * 2 * Math.PI) * arcRadius * Math.sin((i+1) / 5 * Math.PI),
            y: startCanvasPoint.y - Math.sin((0.2+(2 == gameState.numberOfPlayers ? -0.5 : 0.0)+playerIndex) / gameState.numberOfPlayers * 2 * Math.PI) * arcRadius * (1 - Math.cos((i+1) / 5 * Math.PI)) + Math.cos((0.2+(2 == gameState.numberOfPlayers ? -0.5 : 0.0)+playerIndex) / gameState.numberOfPlayers * 2 * Math.PI) * arcRadius * Math.sin((i+1) / 5 * Math.PI)
        }));
        
        // Create dots in starting positions
        for (let i = 0; i < gameState.dotsPerPlayer; i++) {
            playerCanvas.dots.push({
                inStartingArea: true,
                startingPosition: i,
                startPositions: positions,
                pathEntryIndex: pathStartingIndex,
                index: -1, // Not on path yet
                moving: false,
                targetIndex: -1,
                radius: 3 * baseUnit / Math.sqrt(gameState.numberOfPlayers)
            });
        }
        
        drawPlayerDots(playerCanvas);
    });
}


// Add window resize listener
window.addEventListener('resize', () => {
    updateDimensions();
    updateVisualElements();
});
