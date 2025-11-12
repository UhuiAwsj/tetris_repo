class Tetris {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        this.BLOCK_SIZE = 30;
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;

        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));

        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropTime = 0;
        this.dropInterval = 1000;

        this.currentPiece = null;
        this.nextPiece = null;
        this.currentX = 0;
        this.currentY = 0;

        this.colors = [
            '#FF0000', // I - 红色
            '#00FF00', // O - 绿色
            '#0000FF', // T - 蓝色
            '#FFFF00', // S - 黄色
            '#FF00FF', // Z - 紫色
            '#00FFFF', // J - 青色
            '#FFA500'  // L - 橙色
        ];

        this.shapes = [
            // I
            [
                [1, 1, 1, 1]
            ],
            // O
            [
                [1, 1],
                [1, 1]
            ],
            // T
            [
                [0, 1, 0],
                [1, 1, 1]
            ],
            // S
            [
                [0, 1, 1],
                [1, 1, 0]
            ],
            // Z
            [
                [1, 1, 0],
                [0, 1, 1]
            ],
            // J
            [
                [1, 0, 0],
                [1, 1, 1]
            ],
            // L
            [
                [0, 0, 1],
                [1, 1, 1]
            ]
        ];

        this.initializeControls();
        this.updateDisplay();
    }

    initializeControls() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());

        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    handleKeyPress(e) {
        if (!this.gameRunning || this.gamePaused) return;

        switch(e.code) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotatePiece();
                break;
            case 'Space':
                e.preventDefault();
                this.dropToBottom();
                break;
        }
    }

    startGame() {
        if (this.gameRunning) return;

        this.gameRunning = true;
        this.gamePaused = false;
        this.generatePiece();
        this.generatePiece();
        this.gameLoop();

        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
    }

    togglePause() {
        if (!this.gameRunning) return;

        this.gamePaused = !this.gamePaused;
        document.getElementById('pause-btn').textContent = this.gamePaused ? '继续' : '暂停';

        if (!this.gamePaused) {
            this.gameLoop();
        }
    }

    resetGame() {
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropTime = 0;
        this.dropInterval = 1000;
        this.currentPiece = null;
        this.nextPiece = null;

        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        document.getElementById('pause-btn').textContent = '暂停';

        this.updateDisplay();
        this.drawBoard();
        this.drawNextPiece();
    }

    generatePiece() {
        if (!this.nextPiece) {
            this.nextPiece = this.createRandomPiece();
        }

        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createRandomPiece();
        this.currentX = Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.currentY = 0;

        this.drawNextPiece();

        if (this.checkCollision(this.currentPiece.shape, this.currentX, this.currentY)) {
            this.gameOver();
        }
    }

    createRandomPiece() {
        const index = Math.floor(Math.random() * this.shapes.length);
        return {
            shape: this.shapes[index],
            color: this.colors[index]
        };
    }

    movePiece(dx, dy) {
        if (!this.currentPiece) return false;

        const newX = this.currentX + dx;
        const newY = this.currentY + dy;

        if (!this.checkCollision(this.currentPiece.shape, newX, newY)) {
            this.currentX = newX;
            this.currentY = newY;
            return true;
        }

        if (dy > 0) {
            this.lockPiece();
        }

        return false;
    }

    rotatePiece() {
        if (!this.currentPiece) return;

        const rotated = this.rotateMatrix(this.currentPiece.shape);

        if (!this.checkCollision(rotated, this.currentX, this.currentY)) {
            this.currentPiece.shape = rotated;
        }
    }

    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }

        return rotated;
    }

    dropToBottom() {
        while (this.movePiece(0, 1)) {}
    }

    checkCollision(shape, x, y) {
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[i].length; j++) {
                if (shape[i][j]) {
                    const boardX = x + j;
                    const boardY = y + i;

                    if (boardX < 0 || boardX >= this.BOARD_WIDTH ||
                        boardY >= this.BOARD_HEIGHT) {
                        return true;
                    }

                    if (boardY >= 0 && this.board[boardY][boardX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    lockPiece() {
        for (let i = 0; i < this.currentPiece.shape.length; i++) {
            for (let j = 0; j < this.currentPiece.shape[i].length; j++) {
                if (this.currentPiece.shape[i][j]) {
                    const boardY = this.currentY + i;
                    const boardX = this.currentX + j;

                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }

        this.clearLines();
        this.generatePiece();
    }

    clearLines() {
        let linesCleared = 0;

        for (let i = this.BOARD_HEIGHT - 1; i >= 0; i--) {
            if (this.board[i].every(cell => cell !== 0)) {
                this.board.splice(i, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                i++;
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;

            if (this.lines >= this.level * 10) {
                this.level++;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            }

            this.updateDisplay();
        }
    }

    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;

        const now = Date.now();
        if (now - this.dropTime > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropTime = now;
        }

        this.drawBoard();
        requestAnimationFrame(() => this.gameLoop());
    }

    gameOver() {
        this.gameRunning = false;
        alert(`游戏结束！\n最终分数: ${this.score}\n最终等级: ${this.level}\n消除行数: ${this.lines}`);
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
    }

    drawBoard() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= this.BOARD_HEIGHT; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, i * this.BLOCK_SIZE);
            this.ctx.stroke();
        }

        for (let j = 0; j <= this.BOARD_WIDTH; j++) {
            this.ctx.beginPath();
            this.ctx.moveTo(j * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(j * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }

        // 绘制已锁定的方块
        for (let i = 0; i < this.BOARD_HEIGHT; i++) {
            for (let j = 0; j < this.BOARD_WIDTH; j++) {
                if (this.board[i][j]) {
                    this.drawBlock(this.ctx, j, i, this.board[i][j]);
                }
            }
        }

        // 绘制当前方块
        if (this.currentPiece) {
            for (let i = 0; i < this.currentPiece.shape.length; i++) {
                for (let j = 0; j < this.currentPiece.shape[i].length; j++) {
                    if (this.currentPiece.shape[i][j]) {
                        this.drawBlock(
                            this.ctx,
                            this.currentX + j,
                            this.currentY + i,
                            this.currentPiece.color
                        );
                    }
                }
            }
        }
    }

    drawBlock(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(
            x * this.BLOCK_SIZE,
            y * this.BLOCK_SIZE,
            this.BLOCK_SIZE,
            this.BLOCK_SIZE
        );

        // 绘制边框
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            x * this.BLOCK_SIZE,
            y * this.BLOCK_SIZE,
            this.BLOCK_SIZE,
            this.BLOCK_SIZE
        );
    }

    drawNextPiece() {
        if (!this.nextPiece) return;

        this.nextCtx.fillStyle = '#1a1a1a';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        const blockSize = 20;
        const shape = this.nextPiece.shape;

        const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;

        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[i].length; j++) {
                if (shape[i][j]) {
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(
                        offsetX + j * blockSize,
                        offsetY + i * blockSize,
                        blockSize,
                        blockSize
                    );

                    this.nextCtx.strokeStyle = '#000';
                    this.nextCtx.lineWidth = 1;
                    this.nextCtx.strokeRect(
                        offsetX + j * blockSize,
                        offsetY + i * blockSize,
                        blockSize,
                        blockSize
                    );
                }
            }
        }
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new Tetris();
});