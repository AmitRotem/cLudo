function fadeIn(element, speed = 100) {
    if (element.style.display != 'none') return;
    element.style.opacity = 0;
    element.style.display = 'block';
    let opacity = 0;
    let interval = setInterval(function() {
        if (opacity >= 1) {
            clearInterval(interval);
        }
        element.style.opacity = opacity;
        opacity += 0.1;
    }, speed);
}

function fadeOut(element, speed = 20) {
    if (element.style.display == 'none') return;
    element.style.opacity = 1;
    let opacity = 1;
    let interval = setInterval(function() {
        if (opacity <= 0) {
            clearInterval(interval);
            element.style.display = 'none';
        }
        element.style.opacity = opacity;
        opacity -= 0.1;
    }, speed);
}

function getPlayerColor(k, s=100, l=50, playerCount=1) {
    // return color based on player index
    const r = k/playerCount;
    return `hsl(${r * 360}, ${s}%, ${l}%)`
}

function getRandomPawn(ty = 0) {
    const pawns = ['💩 👻 🐒 🦍 🦧 🐕 🦮 🐕‍🦺 🐩 🐈 🐈‍⬛ 🐅 🐆 🐎 🦓 🦌 🦬 🐂 🐃 🐄 🐖 🐏 🐑 🐐 🐪 🐫 🦙 🦒 🦘 🦥 🦦 🦨 🦘 🦡 🦃 🐔 🐓 🐣 🐤 🐥 🐦 🐧 🐦 🦉 🦅 🦆 🦢 🦜 🦩 🕊️ 🐊 🐢 🦎 🐍 🐲 🐉 🦕 🦖 🐳 🐋 🐬 🦭 🐟 🐠 🐡 🦈 🐙 🐚 🦀 🦞 🦐 🦑 🦪 🐌 🦋 🐛 🐜 🐝 🐞 🦗 🕷️ 🕸️ 🦂 🦟 🪰 🪲'.split(' '),
        '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠'.split(' ')];
    // 😈
    return pawns[ty][Math.floor(Math.random() * pawns[ty].length)]
}

function getRandomArrow() {
    const arrows = '➦ ➧ ➨ ➩ ➪ ➫ ➬ ➭ ➮ ➯ ➱ ➲ ➳ ➵ ➸ ➺ ➻ ➼ ➽ ➾ →'.split(' ');
    let randomArrow = arrows[Math.floor(Math.random() * arrows.length)];
    
    return randomArrow;
}

function getRandomStar() {
    const stars = '✪ ✦ ✧ ★ ✩ ✫ ✬ ✭ ✮ ✯ ✰ ✱ ✲ ✳ ✴ ✵ ✶ ✷ ✸ ✹ ✺ ✻ ✼ ✽ ✾ ✿ ❀ ❁ ❂ ❃ ❄ ❅ ❆ ❇ ❈ ❉ ❊ ❋'.split(' ');
    let randomStar = stars[Math.floor(Math.random() * stars.length)];
    return randomStar;
}

// Get dice face based on value (1-6)
function getDiceFace(value) {
    const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return (1 <= value && 6 >= value) ? diceFaces[value - 1] : value.toString();
}

function cumsum(arr) {
    let sum = 0;
    return arr.map(value => sum += value);
}


// Default parametric function
function pulse(theta, frequency, phaseOffset) {
    let p1 = 1.5;
    let p2 = 1;
    let drt = Math.cos(frequency * theta + phaseOffset);
    return 2*(1-(0.5-0.5*drt)**p1)**p2 - 1;
}


function path(t) {
    const amplitude = 0.5;
    const frequency = gameState.numberOfPlayers;
    const phaseOffset = (frequency % 2 == 0 ? -0.5 : -0.75)/frequency * 2 * Math.PI - Math.PI / 2;
    const theta = (-t/gameState.maxT) * 2 * Math.PI;
    
    const radius = gameState.boardRadius;
    const drt = pulse(theta, frequency, 0);
    const xc = radius * (1 + amplitude * drt) * Math.cos(theta+phaseOffset);
    const yc = radius * (1 + amplitude * drt) * Math.sin(theta+phaseOffset);
    return {x:xc, y:yc};
}

function phaseFactor(i, N) {
    return (i + (N % 2 == 0 ? 0.35 : 0.6)) * 2 * Math.PI / N + Math.PI / 2; // Fix phase here
}