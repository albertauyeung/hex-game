/**
 * HEX Game - A two-player connection game
 *
 * Player 1 (Red): Connects top to bottom
 * Player 2 (Blue): Connects left to right
 */

class HexGame {
    constructor(size = 11) {
        this.size = size;
        this.board = [];
        this.currentPlayer = 1; // 1 = Red, 2 = Blue
        this.gameOver = false;
        this.winningPath = [];

        // Hexagon geometry (will be calculated dynamically)
        this.hexRadius = 22;
        this.updateHexGeometry();

        // DOM elements
        this.svgBoard = document.getElementById('hex-board');
        this.boardWrapper = document.querySelector('.board-wrapper');
        this.currentPlayerStone = document.querySelector('.current-player-stone');
        this.winnerModal = document.getElementById('winner-modal');
        this.winnerText = document.getElementById('winner-text');
        this.newGameBtn = document.getElementById('new-game');
        this.playAgainBtn = document.getElementById('play-again');
        this.boardSizeSelect = document.getElementById('board-size');

        this.init();
    }

    updateHexGeometry() {
        this.hexHeight = this.hexRadius * 2;
        this.hexWidth = Math.sqrt(3) * this.hexRadius;
        this.hexVerticalSpacing = this.hexHeight * 0.75;
    }

    calculateOptimalHexRadius() {
        // Get available space from the board wrapper
        const wrapper = this.boardWrapper;
        if (!wrapper) return 22; // Default fallback

        const rect = wrapper.getBoundingClientRect();
        const availableWidth = rect.width - 40; // Padding
        const availableHeight = rect.height - 40; // Padding

        // Calculate the board dimensions based on hex radius
        // Board width = hexWidth * size + (hexWidth / 2) * (size - 1) + padding
        // Board height = hexVerticalSpacing * size + hexRadius + padding

        // For a given radius r:
        // hexWidth = sqrt(3) * r
        // hexVerticalSpacing = 1.5 * r
        // boardWidth ≈ sqrt(3) * r * size + sqrt(3) * r * (size - 1) / 2 = sqrt(3) * r * (1.5 * size - 0.5)
        // boardHeight ≈ 1.5 * r * size + r = r * (1.5 * size + 1)

        const widthFactor = Math.sqrt(3) * (1.5 * this.size - 0.5);
        const heightFactor = 1.5 * this.size + 1;

        const maxRadiusFromWidth = availableWidth / widthFactor;
        const maxRadiusFromHeight = availableHeight / heightFactor;

        // Use the smaller of the two to ensure it fits
        let optimalRadius = Math.min(maxRadiusFromWidth, maxRadiusFromHeight);

        // Clamp to reasonable bounds
        optimalRadius = Math.max(12, Math.min(35, optimalRadius));

        return optimalRadius;
    }

    init() {
        this.setupEventListeners();
        this.newGame();
    }

    setupEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.newGame());
        this.playAgainBtn.addEventListener('click', () => {
            this.hideModal();
            this.newGame();
        });
        this.boardSizeSelect.addEventListener('change', (e) => {
            this.size = parseInt(e.target.value);
            this.newGame();
        });

        // Handle window resize to recalculate board size
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.renderBoard();
            }, 150);
        });

        // Handle orientation change for tablets
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.renderBoard();
            }, 200);
        });
    }

    newGame() {
        this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winningPath = [];
        this.updateCurrentPlayerIndicator();
        this.renderBoard();
    }

    renderBoard() {
        // Clear existing board and reset SVG size to prevent feedback loop
        this.svgBoard.innerHTML = '';
        this.svgBoard.setAttribute('width', 0);
        this.svgBoard.setAttribute('height', 0);

        // Calculate optimal hex radius for current viewport
        this.hexRadius = this.calculateOptimalHexRadius();
        this.updateHexGeometry();

        // Calculate board dimensions
        const boardWidth = this.hexWidth * this.size + (this.hexWidth / 2) * (this.size - 1) + 40;
        const boardHeight = this.hexVerticalSpacing * this.size + this.hexRadius + 40;

        this.svgBoard.setAttribute('width', boardWidth);
        this.svgBoard.setAttribute('height', boardHeight);
        this.svgBoard.setAttribute('viewBox', `0 0 ${boardWidth} ${boardHeight}`);

        // Add gradient definitions
        this.addGradientDefs();

        // Draw border edges first (behind cells)
        this.drawBorderEdges();

        // Draw hexagonal cells
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                this.drawHexCell(row, col);
            }
        }
    }

    addGradientDefs() {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

        // Red gradient
        const redGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        redGradient.setAttribute('id', 'red-gradient');
        redGradient.setAttribute('x1', '0%');
        redGradient.setAttribute('y1', '0%');
        redGradient.setAttribute('x2', '100%');
        redGradient.setAttribute('y2', '100%');
        redGradient.innerHTML = `
            <stop offset="0%" style="stop-color:#ff6b6b" />
            <stop offset="100%" style="stop-color:#e63946" />
        `;

        // Blue gradient
        const blueGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        blueGradient.setAttribute('id', 'blue-gradient');
        blueGradient.setAttribute('x1', '0%');
        blueGradient.setAttribute('y1', '0%');
        blueGradient.setAttribute('x2', '100%');
        blueGradient.setAttribute('y2', '100%');
        blueGradient.innerHTML = `
            <stop offset="0%" style="stop-color:#4cc9f0" />
            <stop offset="100%" style="stop-color:#4361ee" />
        `;

        defs.appendChild(redGradient);
        defs.appendChild(blueGradient);
        this.svgBoard.appendChild(defs);
    }

    drawBorderEdges() {
        const padding = 20;
        const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        edgeGroup.setAttribute('class', 'board-edges');

        // Calculate corner positions for the rhombus
        const corners = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const { x, y } = this.getHexCenter(row, col);
                if (row === 0) corners.push({ type: 'top', x, y, col });
                if (row === this.size - 1) corners.push({ type: 'bottom', x, y, col });
                if (col === 0) corners.push({ type: 'left', x, y, row });
                if (col === this.size - 1) corners.push({ type: 'right', x, y, row });
            }
        }

        // Top edge (Red)
        const topEdge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const topPoints = corners.filter(c => c.type === 'top').sort((a, b) => a.col - b.col);
        let topPath = `M ${topPoints[0].x - this.hexWidth/2} ${topPoints[0].y - this.hexRadius}`;
        topPoints.forEach(p => {
            topPath += ` L ${p.x} ${p.y - this.hexRadius}`;
        });
        topPath += ` L ${topPoints[topPoints.length-1].x + this.hexWidth/2} ${topPoints[topPoints.length-1].y}`;
        topEdge.setAttribute('d', topPath);
        topEdge.setAttribute('class', 'board-edge red');

        // Bottom edge (Red)
        const bottomEdge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const bottomPoints = corners.filter(c => c.type === 'bottom').sort((a, b) => a.col - b.col);
        let bottomPath = `M ${bottomPoints[0].x - this.hexWidth/2} ${bottomPoints[0].y}`;
        bottomPoints.forEach(p => {
            bottomPath += ` L ${p.x} ${p.y + this.hexRadius}`;
        });
        bottomPath += ` L ${bottomPoints[bottomPoints.length-1].x + this.hexWidth/2} ${bottomPoints[bottomPoints.length-1].y}`;
        bottomEdge.setAttribute('d', bottomPath);
        bottomEdge.setAttribute('class', 'board-edge red');

        // Left edge (Blue)
        const leftEdge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const leftPoints = corners.filter(c => c.type === 'left').sort((a, b) => a.row - b.row);
        let leftPath = `M ${leftPoints[0].x - this.hexWidth/2} ${leftPoints[0].y - this.hexRadius}`;
        leftPoints.forEach(p => {
            leftPath += ` L ${p.x - this.hexWidth/2} ${p.y}`;
        });
        leftPath += ` L ${leftPoints[leftPoints.length-1].x} ${leftPoints[leftPoints.length-1].y + this.hexRadius}`;
        leftEdge.setAttribute('d', leftPath);
        leftEdge.setAttribute('class', 'board-edge blue');

        // Right edge (Blue)
        const rightEdge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const rightPoints = corners.filter(c => c.type === 'right').sort((a, b) => a.row - b.row);
        let rightPath = `M ${rightPoints[0].x} ${rightPoints[0].y - this.hexRadius}`;
        rightPoints.forEach(p => {
            rightPath += ` L ${p.x + this.hexWidth/2} ${p.y}`;
        });
        rightPath += ` L ${rightPoints[rightPoints.length-1].x + this.hexWidth/2} ${rightPoints[rightPoints.length-1].y + this.hexRadius}`;
        rightEdge.setAttribute('d', rightPath);
        rightEdge.setAttribute('class', 'board-edge blue');

        edgeGroup.appendChild(topEdge);
        edgeGroup.appendChild(bottomEdge);
        edgeGroup.appendChild(leftEdge);
        edgeGroup.appendChild(rightEdge);
        this.svgBoard.appendChild(edgeGroup);
    }

    getHexCenter(row, col) {
        const padding = 20;
        const x = padding + this.hexWidth / 2 + col * this.hexWidth + row * (this.hexWidth / 2);
        const y = padding + this.hexRadius + row * this.hexVerticalSpacing;
        return { x, y };
    }

    getHexPoints(centerX, centerY) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const x = centerX + this.hexRadius * Math.cos(angle);
            const y = centerY + this.hexRadius * Math.sin(angle);
            points.push(`${x},${y}`);
        }
        return points.join(' ');
    }

    drawHexCell(row, col) {
        const { x, y } = this.getHexCenter(row, col);
        const points = this.getHexPoints(x, y);

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'hex-cell');
        group.setAttribute('data-row', row);
        group.setAttribute('data-col', col);

        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', points);

        group.appendChild(polygon);

        // Apply current state
        const cellState = this.board[row][col];
        if (cellState === 1) {
            group.classList.add('red');
        } else if (cellState === 2) {
            group.classList.add('blue');
        }

        // Check if this cell is in winning path
        if (this.winningPath.some(([r, c]) => r === row && c === col)) {
            group.classList.add('winning');
        }

        // Add click handler
        group.addEventListener('click', () => this.handleCellClick(row, col));

        this.svgBoard.appendChild(group);
    }

    handleCellClick(row, col) {
        if (this.gameOver) return;
        if (this.board[row][col] !== 0) return;

        // Place the stone
        this.board[row][col] = this.currentPlayer;

        // Update the cell visually
        const cell = this.svgBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add(this.currentPlayer === 1 ? 'red' : 'blue');

        // Check for win
        if (this.checkWin(this.currentPlayer)) {
            this.gameOver = true;
            this.highlightWinningPath();
            this.showWinner(this.currentPlayer);
            return;
        }

        // Switch player
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateCurrentPlayerIndicator();
    }

    updateCurrentPlayerIndicator() {
        if (this.currentPlayer === 1) {
            this.currentPlayerStone.classList.remove('blue');
        } else {
            this.currentPlayerStone.classList.add('blue');
        }
    }

    checkWin(player) {
        // Use BFS to find if there's a path from one side to the other
        // Player 1 (Red): top to bottom
        // Player 2 (Blue): left to right

        const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
        const parent = Array(this.size).fill(null).map(() => Array(this.size).fill(null));
        const queue = [];

        // Initialize starting positions
        if (player === 1) {
            // Red starts from top row
            for (let col = 0; col < this.size; col++) {
                if (this.board[0][col] === player) {
                    queue.push([0, col]);
                    visited[0][col] = true;
                    parent[0][col] = [-1, -1]; // Mark as start
                }
            }
        } else {
            // Blue starts from left column
            for (let row = 0; row < this.size; row++) {
                if (this.board[row][0] === player) {
                    queue.push([row, 0]);
                    visited[row][0] = true;
                    parent[row][0] = [-1, -1]; // Mark as start
                }
            }
        }

        // Hex neighbors (6 directions)
        const directions = [
            [-1, 0], [-1, 1],  // Top-left, Top-right
            [0, -1], [0, 1],   // Left, Right
            [1, -1], [1, 0]    // Bottom-left, Bottom-right
        ];

        while (queue.length > 0) {
            const [row, col] = queue.shift();

            // Check if we reached the goal
            if (player === 1 && row === this.size - 1) {
                // Red reached bottom - reconstruct path
                this.reconstructPath(parent, row, col);
                return true;
            }
            if (player === 2 && col === this.size - 1) {
                // Blue reached right - reconstruct path
                this.reconstructPath(parent, row, col);
                return true;
            }

            // Explore neighbors
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;

                if (this.isValidCell(newRow, newCol) &&
                    !visited[newRow][newCol] &&
                    this.board[newRow][newCol] === player) {
                    visited[newRow][newCol] = true;
                    parent[newRow][newCol] = [row, col];
                    queue.push([newRow, newCol]);
                }
            }
        }

        return false;
    }

    reconstructPath(parent, endRow, endCol) {
        this.winningPath = [];
        let current = [endRow, endCol];

        while (current[0] !== -1) {
            this.winningPath.push(current);
            current = parent[current[0]][current[1]];
        }
    }

    isValidCell(row, col) {
        return row >= 0 && row < this.size && col >= 0 && col < this.size;
    }

    highlightWinningPath() {
        for (const [row, col] of this.winningPath) {
            const cell = this.svgBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('winning');
            }
        }
    }

    showWinner(player) {
        const playerName = player === 1 ? 'Red' : 'Blue';
        const playerNum = player === 1 ? '1' : '2';
        this.winnerText.textContent = `Player ${playerNum} (${playerName}) Wins!`;
        this.winnerText.style.background = player === 1
            ? 'linear-gradient(135deg, #ff6b6b 0%, #e63946 100%)'
            : 'linear-gradient(135deg, #4cc9f0 0%, #4361ee 100%)';
        this.winnerText.style.webkitBackgroundClip = 'text';
        this.winnerText.style.webkitTextFillColor = 'transparent';
        this.winnerText.style.backgroundClip = 'text';
        this.winnerModal.classList.remove('hidden');
    }

    hideModal() {
        this.winnerModal.classList.add('hidden');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HexGame(11);
});
