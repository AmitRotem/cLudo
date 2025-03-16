function testDice(N = 2**14) {
    let rolls = Array.from({ length: N }, () => myMaxRandom());
    const occurences = rolls.reduce((acc, value) => {
        acc[value - 1]++;
        return acc;
    }, [0,0,0,0,0,0]);
    const meanOccurences = occurences.map(occurence => (occurence / N - 1 / 6)/(Math.sqrt(5/N)/6));
    
    const meanRolls = rolls.reduce((a, b) => a + b, 0) / N
    rolls = rolls.map(value => value - meanRolls);
    let c0 = rolls.map((value, index) => value * rolls[index])
    c0 = c0.reduce((acc, value) => acc + value, 0) / rolls.length
    let c1 = rolls.slice(0, -1).map((value, index) => value * rolls[index + 1])
    c1 = c1.reduce((acc, value) => acc + value, 0) / (rolls.length-1)

    const mean = meanOccurences.map(value => Math.round(value * 10000) / 10000)
    const corr = [c1/c0]

    updateGameInfo(`mean occurences * 6 ${mean} ;; corr ${[corr]}`);
}

function test1() {
    testMode = !testMode;
    console.log(`Test mode: ${testMode}`);
    return testMode;
}

function test2() {
    currentBoard.players.forEach(player => {
        player.autoMove = true;
        player.style = "Naive";
    });
    console.log(`Test mode 2: auto play on`);
    handleDiceClick();
}


function testPlayerAndDisplaySync(player) {
    const dots = player.display.dots;
    // numBosons
    console.assert(dots.length === player.numBosons, player, `number of dots is incompatible with numBosons!! got ${dots.length} expected ${player.numBosons}`);

    // inStartingArea
    console.assert(dots.every((dot,j) => (dot.inStartingArea ? (player.locations[j].im < 0) : (player.locations[j].im>=0))), player, `inStartingArea is incompatible with locations!! dots have ${dots.map(dot => dot.inStartingArea)} but locations are ${player.locations.map(location => location.im)}`);

    // index
    console.assert(dots.every((dot,j) => (dot.inStartingArea ? true : (dot.index === player.locations[j].re))), player, `index is incompatible with locations!! dots have ${dots.map(dot => dot.index)} but locations are ${player.locations.map(location => location.re)}`);

    // inHomePath
    console.assert(dots.every((dot,j) => (dot.inHomePath ? (player.locations[j].im === dot.homePathStep) : (player.locations[j].im <= 0))), player, `homePathStep is incompatible with locations!! dots have ${dots.map(dot => dot.inHomePath)} with steps ${dots.map(dot => dot.homePathStep)} but locations are ${player.locations.map(location => location.im)}`);
    


    /// if in home path;
    // stepsToHome # Int

    // player.state
    // player.patterns
    // player.bosonsInPlay # calc from locations ?
    // player.finishedBosons # calc from locations ?
}

function testBoardAndDisplaySync() {
    console.assert(currentBoard.players.length === currentBoard.numPlayers, currentBoard, `number of players is incompatible with numPlayers!! got ${currentBoard.players.length} expected ${currentBoard.numPlayers}`);
    console.assert(currentBoard.players.every(player => player.dieSize === currentBoard.dieSize), currentBoard, `dieSize is incompatible with currentBoard.dieSize!! got ${currentBoard.players.map(player => player.dieSize)} expected ${currentBoard.dieSize}`);
    currentBoard.players.map(testPlayerAndDisplaySync);
}
