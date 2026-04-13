const game = {
    gridSize: 10,
    cells: [], // 1D array of 100 cells. 0=neutral, 1=player, 2=bot
    botInterval: null,
    
    init() {
        this.cells = new Array(this.gridSize * this.gridSize).fill(0);
        // Starting positions
        this.cells[0] = 1; // Top-left is player
        this.cells[this.cells.length - 1] = 2; // Bottom-right is bot
        
        document.getElementById('overlay').classList.add('hidden');
        this.renderGrid();
        this.updateStats();

        if(this.botInterval) clearInterval(this.botInterval);
        this.botInterval = setInterval(() => this.botMove(), 800); // Bot moves every 800ms
    },

    renderGrid() {
        const gridEl = document.getElementById('game-grid');
        gridEl.innerHTML = '';
        
        for (let i = 0; i < this.cells.length; i++) {
            const cellEl = document.createElement('div');
            cellEl.className = 'cell';
            if (this.cells[i] === 1) cellEl.classList.add('player');
            if (this.cells[i] === 2) cellEl.classList.add('bot');
            
            cellEl.onclick = () => this.clickCell(i);
            gridEl.appendChild(cellEl);
        }
    },

    clickCell(index) {
        // Can only claim neutral (0) or bot (2) if adjacent to player (1)
        if (this.cells[index] === 1) return; // Already ours
        
        if (this.isAdjacent(index, 1)) {
            this.cells[index] = 1;
            this.updateDomCell(index);
            this.updateStats();
            this.checkWin();
        }
    },

    botMove() {
        // Find all possible moves for bot
        const validMoves = [];
        for (let i = 0; i < this.cells.length; i++) {
            if (this.cells[i] !== 2 && this.isAdjacent(i, 2)) {
                validMoves.push(i);
            }
        }
        
        if (validMoves.length > 0) {
            // Pick a random valid move
            const move = validMoves[Math.floor(Math.random() * validMoves.length)];
            this.cells[move] = 2;
            this.updateDomCell(move);
            this.updateStats();
            this.checkWin();
        }
    },

    isAdjacent(index, owner) {
        const row = Math.floor(index / this.gridSize);
        const col = index % this.gridSize;

        // Check top, bottom, left, right
        if (row > 0 && this.cells[index - this.gridSize] === owner) return true;
        if (row < this.gridSize - 1 && this.cells[index + this.gridSize] === owner) return true;
        if (col > 0 && this.cells[index - 1] === owner) return true;
        if (col < this.gridSize - 1 && this.cells[index + 1] === owner) return true;

        return false;
    },

    updateDomCell(index) {
        const el = document.getElementById('game-grid').children[index];
        el.className = 'cell ' + (this.cells[index] === 1 ? 'player' : 'bot');
    },

    updateStats() {
        const pScore = this.cells.filter(c => c === 1).length;
        const bScore = this.cells.filter(c => c === 2).length;
        
        document.getElementById('p-score').innerText = pScore;
        document.getElementById('b-score').innerText = bScore;

        const totalClaimed = pScore + bScore;
        let pPercent = 50;
        if (totalClaimed > 0) {
            pPercent = (pScore / totalClaimed) * 100;
        }
        document.getElementById('dom-fill').style.width = `${pPercent}%`;
    },

    checkWin() {
        const neutralLeft = this.cells.filter(c => c === 0).length;
        const pScore = this.cells.filter(c => c === 1).length;
        const bScore = this.cells.filter(c => c === 2).length;

        // Game ends if board is full, or one player is wiped out
        if (neutralLeft === 0 || pScore === 0 || bScore === 0) {
            clearInterval(this.botInterval);
            let msg = '';
            if (pScore > bScore) msg = "YOU DOMINATED!";
            else if (bScore > pScore) msg = "BOT WON!";
            else msg = "DRAW!";
            
            document.getElementById('result-msg').innerText = msg;
            document.getElementById('overlay').classList.remove('hidden');
        }
    }
};

window.onload = () => game.init();
