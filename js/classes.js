
class Player {
    constructor({ name, color, numBosons, dieSize, autoMove, inputIndex, outputIndex }) {
        this.name = name;
        this.color = color;
        this.numBosons = numBosons;
        this.dieSize = dieSize;
        this.autoMove = autoMove;
        this.inputIndex = inputIndex;
        this.outputIndex = outputIndex;
        this.state = [math.complex(1.0)]; // dynamic
        this.patterns = [Array(numBosons).fill(1)]; // dynamic
        this.locations = Array.from({ length: numBosons }, (_, i) => math.complex(inputIndex, -(i + 1))); // dynamic
        this.die = 0; // dynamic
        this.diceHistory = Array(dieSize).fill(0); // dynamic
        this.bosonsInPlay = 0; // dynamic
        this.finishedBosons = 0; // dynamic
        this.score = 0; // dynamic
        this.style = autoMove ? ['Naive', 'Angry', 'Nice'][Math.floor(Math.random() * 3)] : 'Human'; // dynamic
        this.display = null; // dynamic
        /// display contains:
        /// canvas, ctx
        /// dots
        /// initial;
        // homePathStep # Int
        // inHomePath # Bool
        // inStartingArea # Bool
        // index # Int
        // moving # Bool
        // radius # Float
        // startPosition # {x, y} location
        // targetIndex # Int
        
        /// if in home path;
        // homePathPosition # {x, y}
        // interpolation # {x, y}
        // stepsToHome # Int
    }
}

class Board {
    constructor({ safeIndcies, players, layerLength, numPlayers, numBosons, circuitLength, currentPlayerIndex, turnsHistory, winner, dieSize, homeLayerLength, boardRadius }) {
        this.safeIndcies = safeIndcies;
        this.players = players;
        this.layerLength = layerLength;
        this.numPlayers = numPlayers;
        this.numBosons = numBosons;
        this.circuitLength = circuitLength;
        this.currentPlayerIndex = currentPlayerIndex;
        this.turnsHistory = turnsHistory;
        this.winner = winner;
        this.dieSize = dieSize;
        this.homeLayerLength = homeLayerLength;
        this.boardRadius = boardRadius;
        this.diceRolled = false;
        this.extraTurn = false;
        this.gameStarted = false;
        this.gameEnded = false;
        this.animating = false;
        this.display = {};
    }
}

function createBoard(numPlayers, options = {}) {
    const {
        autoMovers = Array(numPlayers).fill(false),
        layerLength = 13,
        layerSafeIndcies = [2, layerLength - 3],
        layerInputIndcies = 2,
        layerOutputIndex = 0,
        ...kwargs
    } = options;

    const safeIndcies = [].concat(...Array.from({ length: numPlayers }, (_, i) => layerSafeIndcies.map(index => index + i * layerLength))).sort((a, b) => a - b);
    const players = Array.from({ length: numPlayers }, (_, i) => new Player({
        name: getRandomPawn(),
        color: getPlayerColor(i / numPlayers),
        numBosons: options.numBosons || 4,
        dieSize: options.dieSize || 6,
        autoMove: autoMovers[i],
        inputIndex: layerInputIndcies + i * layerLength,
        outputIndex: layerOutputIndex + i * layerLength
    }));

    for (let i = 0; i < numPlayers; i++) {
        getPlayerDistinctPawn(players, i, false);
    }

    const board = new Board({
        safeIndcies,
        players,
        layerLength,
        numPlayers,
        numBosons: 4,
        circuitLength: layerLength * numPlayers,
        currentPlayerIndex: 0,
        turnsHistory: Array(numPlayers).fill(0),
        winner: -1,
        dieSize: 6,
        homeLayerLength: 6,
        boardRadius: (numPlayers % 2 == 0 ? 2.1 : 1.94) - 0.5*(numPlayers<3),
        ...kwargs
    });

    return board;
}

currentBoard = createBoard(4);
console.debug(currentBoard);