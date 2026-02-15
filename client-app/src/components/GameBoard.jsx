import React from 'react';
import Cell from './Cell';

const GameBoard = ({ grid, onCellClick, players }) => {
    if (!grid || grid.length === 0) return <div>Loading grid...</div>;

    return (
        <div
            className="grid gap-2 p-3 sm:p-4 rounded-xl mx-auto touch-manipulation"
            style={{
                gridTemplateColumns: `repeat(${grid[0].length}, minmax(0, 1fr))`,
            }}
        >
            {grid.map((row, rIndex) => (
                row.map((cell, cIndex) => (
                    <Cell
                        key={`${rIndex}-${cIndex}`}
                        cell={cell}
                        onClick={() => onCellClick(rIndex, cIndex)}
                        players={players}
                    />
                ))
            ))}
        </div>
    );
};

export default GameBoard;
