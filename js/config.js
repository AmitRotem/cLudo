// Game dimensions, aspect ratio
// Side length, number of players
// Base unit for responsive scaling
// Path parameters (amplitude, frequency, etc.)

const sideLength = 6;
const resParameter = 150;
// Add responsive design support
let aspectRatio = 4/3; // Standard game board aspect ratio
// animation speed
const fastSpeedFactor = 0.2;

// Player colors and data
// Game state
let gameState = {
    currentPlayerIndex: 0,
    numberOfPlayers: 4,
    dotsPerPlayer: 4,
    pathToHome: sideLength,
    animating: false,
    diceRolled: false,  // Track if dice has been rolled this turn
    lastRoll: null,      // Store the last rolled value
    dieFaces: 6,
    extraTurn: false,
    gameStarted: false,
    gameEnded: false,
};

// init player data
let players = Array.from({ length: gameState.numberOfPlayers }, (_, k) => {
    return { color: getPlayerColor(k / gameState.numberOfPlayers), name: getRandomPawn()};
});


function getPlayerNewPawn(i) {
    do {
        players[i].name = getRandomPawn();
    } while (players.slice(0, i).some(p => players[i].name === p.name));
}

