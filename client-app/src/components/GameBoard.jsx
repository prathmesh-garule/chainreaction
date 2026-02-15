import React from 'react';
import Cell from './Cell';

const GameBoard = ({ grid, onCellClick, players }) => {
    if (!grid || grid.length === 0) return <div>Loading grid...</div>;

    return (
        <div
            className="grid gap-1 bg-gray-800 p-2 rounded-lg shadow-2xl border border-gray-700 mx-auto"
            style={{
                gridTemplateColumns: `repeat(${grid[0].length}, minmax(40px, 1fr))`,
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
