// Game dimensions, aspect ratio
// Side length, number of players
// Base unit for responsive scaling
// Path parameters (amplitude, frequency, etc.)

const sideLength = 6;
const resParameter = 100;
// Add responsive design support
let aspectRatio = 4/3; // Standard game board aspect ratio
let scale = 1;
let baseUnit = 10; // Base unit for scaling everything
// animation speed
const fastSpeedFactor = 0.2;

// Player colors and data
// Game state
let gameState = {
    currentPlayerIndex: 0,
    dotsPerPlayer: 4,
    pathToHome: sideLength,
    animating: false,
    diceRolled: false,  // Track if dice has been rolled this turn
    lastRoll: null,      // Store the last rolled value
    dieFaces: 6,
};
gameState.numberOfPlayers = 4;
gameState.maxT = gameState.numberOfPlayers * (sideLength * 2 + 1);
gameState.safeIndex = [
    ...Array.from({ length: gameState.numberOfPlayers }, (_, i) => ((i * (sideLength * 2 + 1)) + 2) % gameState.maxT),
    ...Array.from({ length: gameState.numberOfPlayers }, (_, i) => ((i * (sideLength * 2 + 1)) - 3 + gameState.maxT) % gameState.maxT)
].sort((a, b) => a - b);
gameState.autoMover = Array.from({ length: gameState.numberOfPlayers }, () => false);

let usedPawns = new Set();
let players = Array.from({ length: gameState.numberOfPlayers }, (_, k) => {
    let pawn;
    do {
        pawn = getRandomPawn();
    } while (usedPawns.has(pawn));
    usedPawns.add(pawn);
    return { color: getPlayerColor(k / gameState.numberOfPlayers), name: pawn };
});
