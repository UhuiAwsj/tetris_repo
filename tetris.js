const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextContext = nextCanvas.getContext('2d');

// Handle High DPI
const scale = 20;
const dpr = window.devicePixelRatio || 1;

canvas.width = 200 * dpr;
canvas.height = 400 * dpr;
canvas.style.width = '200px';
canvas.style.height = '400px';

context.scale(scale * dpr, scale * dpr);

nextCanvas.width = 80 * dpr;
nextCanvas.height = 80 * dpr;
nextCanvas.style.width = '80px';
nextCanvas.style.height = '80px';

nextContext.scale(scale * dpr, scale * dpr);

const ARENA_WIDTH = 10;
const ARENA_HEIGHT = 20;

// Pastel / Bright Colors
const COLORS = [
    null,
    '#FF6B6B', // T (Red/Pink)
    '#4ECDC4', // O (Teal)
    '#45B7D1', // L (Blue)
    '#96CEB4', // J (Greenish)
    '#FFEEAD', // I (Yellow)
    '#D4A5A5', // S (Rose)
    '#9B59B6', // Z (Purple)
];

function createPiece(type) {
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // Base block
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);

                // Glossy effect (Highlight)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(x + offset.x, y + offset.y, 1, 0.1);
                ctx.fillRect(x + offset.x, y + offset.y, 0.1, 1);

                // Shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.fillRect(x + offset.x + 0.9, y + offset.y, 0.1, 1);
                ctx.fillRect(x + offset.x, y + offset.y + 0.9, 1, 0.1);

                // Inner bevel
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillRect(x + offset.x + 0.2, y + offset.y + 0.2, 0.6, 0.6);
            }
        });
    });
}

function draw() {
    // Clear with transparent or light background
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Optional: Draw faint grid
    context.strokeStyle = 'rgba(0, 0, 0, 0.03)';
    context.lineWidth = 0.05;
    for (let i = 0; i < 10; i++) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, 20);
        context.stroke();
    }
    for (let i = 0; i < 20; i++) {
        context.beginPath();
        context.moveTo(0, i);
        context.lineTo(10, i);
        context.stroke();
    }

    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

function drawNext() {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

    // Center the piece in the preview box
    const xOffset = (4 - nextPiece.length) / 2;
    const yOffset = (4 - nextPiece.length) / 2;

    drawMatrix(nextPiece, { x: xOffset, y: yOffset }, nextContext);
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

function playerReset() {
    if (nextPiece === null) {
        nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
    }
    player.matrix = nextPiece;
    nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
    drawNext();

    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
        (player.matrix[0].length / 2 | 0);

    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        player.level = 1;
        dropInterval = 1000;
        updateScore();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
    if (!isPaused) {
        const deltaTime = time - lastTime;
        lastTime = time;

        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }

        draw();
        requestAnimationFrame(update);
    }
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
    document.getElementById('level').innerText = player.level;
}

function arenaSweep() {
    let rowCount = 0;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        rowCount++;
    }

    if (rowCount > 0) {
        player.score += rowCount * 10 * rowCount;
        // Level up every 100 points (simplified)
        player.level = Math.floor(player.score / 100) + 1;
        dropInterval = Math.max(100, 1000 - (player.level - 1) * 100);
    }
}

const arena = createMatrix(10, 20);

const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
    level: 1,
};

const pieces = 'ILJOTSZ';
let nextPiece = null;
let isPaused = true;

document.addEventListener('keydown', event => {
    if (isPaused) return;

    if (event.keyCode === 37) {
        playerMove(-1);
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        playerDrop();
    } else if (event.keyCode === 38) {
        playerRotate(1);
    }
});

document.getElementById('start-btn').addEventListener('click', () => {
    const btn = document.getElementById('start-btn');
    if (isPaused) {
        isPaused = false;
        btn.innerText = "Pause Game";
        if (player.matrix === null) {
            playerReset();
        }
        update();
    } else {
        isPaused = true;
        btn.innerText = "Resume Game";
    }
});

playerReset();
updateScore();
draw();
