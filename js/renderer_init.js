// Canvas initialization
// Board rendering functions
// Path drawing
// Dot/pawn rendering
// Coordinate conversion functions

// Create background canvas for static curves
const bgCanvas = document.createElement('canvas');
const bgCtx = bgCanvas.getContext('2d');
// bgCanvas.width = 3200;
// bgCanvas.height = 2400;
bgCanvas.style.border = 'none'; // Remove the border
bgCanvas.style.margin = '0';    // Remove margin
bgCanvas.style.display = 'block';
bgCanvas.style.position = 'absolute';

// Create a container div to hold all canvases
const container = document.createElement('div');
container.style.position = 'relative';
// container.style.width = '3200px';
// container.style.height = '2400px';
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
gameTitle.style.width = 'auto';
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
    console.debug('Toggling full screen mode');
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
    // redraw everything after resizing
    updateDimensions();
    updateVisualElements();
    currentBoard.players.forEach(player => drawPlayerDots(player));
    if (currentBoard.gameEnded) {resetGame();}
});

// Create scoreboard below the title
const scoreBoard = document.createElement('div');
scoreBoard.id = 'score-board';
scoreBoard.style.position = 'absolute';
scoreBoard.style.top = '50px';
scoreBoard.style.left = '0';
scoreBoard.style.width = 'auto';
scoreBoard.style.textAlign = 'left';
scoreBoard.style.fontSize = '24px';
scoreBoard.style.fontWeight = 'bold';
scoreBoard.style.color = '#333';
scoreBoard.style.textShadow = '2px 2px 4px rgba(255, 255, 255, 0.7)';
scoreBoard.style.pointerEvents = 'none'; // Prevent clicks
scoreBoard.style.zIndex = '100'; // Ensure it's on top
container.appendChild(scoreBoard);

// Create UI elements
const gameInfo = document.createElement('div');
container.appendChild(gameInfo);

// Create path points
let pathPoints;

// Create player controls
let playerControls;