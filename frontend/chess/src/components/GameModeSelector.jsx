import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ModeSelectorImage from '../assets/ModeSelectorImage.png';

function GameModeSelector() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  const gameModes = [
    { path: '/global-multiplayer', label: 'Global Multiplayer', delay: 'delay-100' },
    { path: '/local-multiplayer', label: 'Local Multiplayer', delay: 'delay-200' },
    { path: '/against-stockfish', label: 'Against ELO:3634', delay: 'delay-300' },
    { path: '/puzzle', label: 'Puzzles', delay: 'delay-400' },
    { path: '/random-play', label: 'Random Play (Always win)', delay: 'delay-500' }
  ];

  return (
    <div className='flex h-screen items-center w-screen'>
      <div className='w-1/2 h-screen'></div>
      <div className="w-1/2 h-screen bg-cover bg-center relative overflow-hidden"
        style={{ backgroundImage: `url(${ModeSelectorImage})` }}>
        
        <div className='mt-16 transform w-full'>
          {gameModes.map(({ path, label, delay }) => (
            <div key={path} className={`game-mode ${animate ? `animate-slide-in ${delay}` : ''}`}>
              <div className="bg-gray-200 bg-opacity-10 backdrop-filter backdrop-blur-xl border border-gray-500 p-2 md:p-4 lg:p-5 my-4 rounded-xl shadow-lg w-11/12 max-w-md mx-auto">
                <Link to={path} className="text-gray-700 text-xl md:text-2xl lg:text-3xl text-center block">{label}</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GameModeSelector;
