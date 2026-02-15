import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Cell = ({ cell, onClick, players }) => {
    const { orbs, owner, maxOrbs } = cell;

    const ownerPlayer = players.find(p => p.id === owner);
    const color = ownerPlayer ? ownerPlayer.color : '#4B5563'; // Gray for empty

    // Determine orb layout based on count
    const renderOrbs = () => {
        const orbElements = [];
        for (let i = 0; i < orbs; i++) {
            orbElements.push(
                <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ duration: 0.3, type: "spring" }}
                    className="absolute w-3 h-3 rounded-full shadow-[0_0_5px_currentColor]"
                    style={{
                        backgroundColor: color,
                        color: color,
                        top: i === 0 ? '20%' : i === 1 ? '50%' : '20%',
                        left: i === 0 ? '20%' : i === 1 ? '50%' : '80%',
                        transform: `translate(-50%, -50%)`
                    }}
                />
            );
        }

        // Using a spinner container for the orbs
        return (
            <motion.div
                className="w-full h-full relative"
                animate={{ rotate: orbs * 120 }} // Rotate based on count speed
                transition={{ repeat: Infinity, duration: 20 / (orbs || 1), ease: "linear" }}
            >
                {Array.from({ length: orbs }).map((_, i) => {
                    const angle = (360 / orbs) * i;
                    const radius = 10;
                    return (
                        <div
                            key={i}
                            className="absolute w-4 h-4 rounded-full shadow-md top-1/2 left-1/2"
                            style={{
                                backgroundColor: color,
                                border: '1px solid rgba(255,255,255,0.3)',
                                transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`
                            }}
                        ></div>
                    );
                })}
            </motion.div>
        );
    };

    return (
        <div
            onClick={onClick}
            className={`
        w-16 h-16 flex items-center justify-center 
        border border-gray-700 bg-gray-900 
        hover:bg-gray-800 cursor-pointer 
        transition-colors duration-200
        relative overflow-hidden
      `}
            style={{
                boxShadow: owner ? `inset 0 0 10px ${color}20` : 'none',
                borderColor: owner ? `${color}40` : '',
            }}
        >
            <AnimatePresence>
                {orbs > 0 && renderOrbs()}
            </AnimatePresence>

            {/* Critical Mass Indicator (Subtle) */}
            <div className="absolute bottom-1 right-1 text-[8px] text-gray-600">
                {orbs}/{maxOrbs}
            </div>
        </div>
    );
};

export default Cell;
