function createGrid(rows, cols) {
    const grid = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            let maxOrbs = 4;
            if ((r === 0 || r === rows - 1) && (c === 0 || c === cols - 1)) maxOrbs = 2; // Corner
            else if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) maxOrbs = 3; // Edge

            row.push({
                row: r,
                col: c,
                orbs: 0,
                owner: null,
                maxOrbs: maxOrbs
            });
        }
        grid.push(row);
    }
    return grid;
}

function processMove(room, row, col) {
    const { grid, players, turnIndex } = room;
    const player = players[turnIndex];
    const cell = grid[row][col];

    // Validation
    if (cell.owner && cell.owner !== player.id) {
        return { valid: false };
    }

    // Add orb
    cell.orbs++;
    cell.owner = player.id;

    // Check explosions
    let pendingExplosions = [];
    if (cell.orbs >= cell.maxOrbs) {
        pendingExplosions.push(cell);
    }

    const stabilizationLimit = 5000;
    let iterations = 0;

    while (pendingExplosions.length > 0 && iterations < stabilizationLimit) {
        iterations++;
        const currentExplosions = [...pendingExplosions];
        pendingExplosions = [];

        for (const explodingCell of currentExplosions) {
            explodingCell.orbs -= explodingCell.maxOrbs;
            if (explodingCell.orbs === 0) {
                explodingCell.owner = null;
            }

            const neighbors = getNeighbors(explodingCell.row, explodingCell.col, grid.length, grid[0].length);
            for (const { r, c } of neighbors) {
                const neighbor = grid[r][c];
                neighbor.orbs++;
                neighbor.owner = player.id; // Capture!
                if (neighbor.orbs >= neighbor.maxOrbs) {
                    pendingExplosions.push(neighbor);
                }
            }
        }
    }

    // Check elimination and winner
    // A player is eliminated if they have 0 orbs on the board.
    // BUT checking during the first round is tricky.
    // Let's assume game starts with everyone having 0.
    // So we can only check elimination if specific condition is met?
    // Actually, simpler: Winner is the LAST player remaining.
    // Only check for winner if processMove results in elimination.

    // We can count orbs for each player.
    const playerOrbCounts = {};
    players.forEach(p => playerOrbCounts[p.id] = 0);

    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
            if (grid[r][c].owner) {
                playerOrbCounts[grid[r][c].owner] = (playerOrbCounts[grid[r][c].owner] || 0) + grid[r][c].orbs;
            }
        }
    }

    const activePlayers = players.filter(p => playerOrbCounts[p.id] > 0);
    // If it's early game (e.g. total moves < players.length), don't eliminate.
    // But determining early game is state dependent.
    // For now, let's just use checkWinCondition separately or here.

    let winner = null;
    let eliminatedPlayers = [];

    // Only verify eliminations if enough turns have passed?
    // Let's assume strict rule: if you have 0 orbs, you are out.
    // Exception: You haven't played yet?
    // The player who just played MUST have orbs (they placed one).
    // So we check if anyone else lost all orbs.

    // Actually, to correctly implementing "turn 1 safety":
    // Just rely on the fact that if you haven't played, you have 0 orbs.
    // So "elimination" only matters if you HAD orbs and lost them.
    // Or simpler: The game ends when only 1 player has orbs (AND more than 1 player had orbs previously? Or just waiting until everyone played once?)

    // For MVP, enable win check only if total orbs on board > players.length?
    let totalOrbs = 0;
    for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[0].length; c++) totalOrbs += grid[r][c].orbs;

    if (totalOrbs > players.length) {
        if (activePlayers.length === 1) {
            winner = activePlayers[0];
        }
    }

    let nextTurnIndex = (turnIndex + 1) % players.length;
    // Skip eliminated players?
    // For MVP simple rotation.

    return {
        valid: true,
        newGrid: grid,
        nextTurnIndex,
        winner,
        eliminatedPlayers
    };
}

function checkWinCondition(grid, players) {
    // Utility for external check if needed, but logic is inside processMove mostly.
    // We can just return null for now if not used effectively.
    return null;
}

function getNeighbors(row, col, rows, cols) {
    const neighbors = [];
    if (row > 0) neighbors.push({ r: row - 1, c: col });
    if (row < rows - 1) neighbors.push({ r: row + 1, c: col });
    if (col > 0) neighbors.push({ r: row, c: col - 1 });
    if (col < cols - 1) neighbors.push({ r: row, c: col + 1 });
    return neighbors;
}

module.exports = { createGrid, processMove, checkWinCondition };
