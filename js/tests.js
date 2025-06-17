console.log("`testDice([N=2**14])` to test the dice rolls");
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
    return [mean, corr]
}

console.log("`test1()` to toggle test mode. currently does nothing.");
function test1() {
    testMode = !testMode;
    console.log(`Test mode: ${testMode}`);
    return null;
}

console.log("`test2()` to toggle auto play mode for all players.");
function test2() {
    currentBoard.players.forEach(player => {
        player.autoMove = true;
        player.style = ['Naive', 'Angry', 'Nice'][Math.floor(Math.random() * 3)];
    });
    console.log(`Test mode 2: auto play on`);
    handleDiceClick();
    return null;
}

