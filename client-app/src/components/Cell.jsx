import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Cell = ({ cell, onClick, players }) => {
    const { orbs, owner, maxOrbs } = cell;

    const ownerPlayer = players.find(p => p.id === owner);
    const color = ownerPlayer ? ownerPlayer.color : '#374151'; // Gray-700

    // Determine orb layout
    const renderOrbs = () => {
        return (
            <motion.div
                className="w-full h-full relative"
                animate={{ rotate: orbs * 120 }}
                transition={{ repeat: Infinity, duration: 30 / (orbs || 1), ease: "linear" }}
            >
                {Array.from({ length: orbs }).map((_, i) => {
                    const angle = (360 / orbs) * i;
                    return (
                        <div
                            key={i}
                            className="absolute w-4 h-4 rounded-full shadow-[0_0_10px_currentColor] top-1/2 left-1/2"
                            style={{
                                backgroundColor: color,
                                color: color,
                                border: '2px solid rgba(255,255,255,0.4)',
                                transform: `translate(-50%, -50%) rotate(${angle}deg) translate(12px) rotate(-${angle}deg)`
                            }}
                        ></div>
                    );
                })}
            </motion.div>
        );
    };

    return (
        <motion.div
            onClick={onClick}
            whileHover={{ scale: 0.95 }}
            whileTap={{ scale: 0.9 }}
            className={`
        w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center 
        rounded-xl
        border border-gray-800 bg-gray-900/50
        hover:bg-gray-800/80 cursor-pointer 
        transition-all duration-200
        relative overflow-hidden
        backdrop-blur-sm
      `}
            style={{
                boxShadow: owner ? `inset 0 0 20px ${color}20, 0 0 0 1px ${color}30` : 'none',
            }}
        >
            <AnimatePresence>
                {orbs > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="w-full h-full"
                    >
                        {renderOrbs()}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Critical Mass Indicator */}
            <div
                className="absolute bottom-1 right-1.5 text-[9px] font-bold text-gray-700 select-none"
                style={{ color: owner ? `${color}80` : '' }}
            >
                {orbs > 0 ? `${orbs}/${maxOrbs}` : ''}
            </div>
        </motion.div>
    );
};

export default Cell;
