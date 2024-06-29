import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import ModeSelectorImage from '../assets/ModeSelectorImage.png';

function GameModeSelector() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation after initial render
    setAnimate(true);
  }, []);

  return (
    <div className='flex h-screen items-center w-screen'>
      <div className='w-1/2 h-screen'></div>
      <div className="w-1/2 h-screen bg-cover bg-center relative overflow-hidden"
        style={{ backgroundImage: `url(${ModeSelectorImage})` }}>
        <div className='mt-16 transform w-full'>
          {/* Random */}
          <div className={`game-mode ${animate ? 'animate-slide-in delay-100' : ''}`}>
            <div className="bg-gray-200 bg-opacity-10 backdrop-filter backdrop-blur-xl border border-gray-500 p-2 md:p-4 lg:p-5 my-4 rounded-xl shadow-lg w-11/12 max-w-md mx-auto">
              <Link to="/random-play" className="text-gray-700 text-xl md:text-2xl lg:text-3xl text-center block">Random Play</Link>
            </div>
          </div>
          {/* Local Multiplayer */}
          <div className={`game-mode ${animate ? 'animate-slide-in delay-200' : ''}`}>
            <div className="bg-gray-200 bg-opacity-10 backdrop-filter backdrop-blur-xl border border-gray-500 p-2 md:p-4 lg:p-5 my-4 rounded-xl shadow-lg w-11/12 max-w-md mx-auto">
              <Link to="/local-multiplayer" className="text-gray-700 text-xl md:text-2xl lg:text-3xl text-center block">Local Multiplayer</Link>
            </div>
          </div>
          {/* Global Multiplayer */}
          <div className={`game-mode ${animate ? 'animate-slide-in delay-300' : ''}`}>
            <div className="bg-gray-200 bg-opacity-10 backdrop-filter backdrop-blur-xl border border-gray-500 p-2 md:p-4 lg:p-5 my-4 rounded-xl shadow-lg w-11/12 max-w-md mx-auto">
              <Link to="/global-multiplayer" className="text-gray-700 text-xl md:text-2xl lg:text-3xl text-center block">Global Multiplayer</Link>
            </div>
          </div>
          {/* Against Friend */}
          <div className={`game-mode ${animate ? 'animate-slide-in delay-400' : ''}`}>
            <div className="bg-gray-200 bg-opacity-10 backdrop-filter backdrop-blur-xl border border-gray-500 p-2 md:p-4 lg:p-5 my-4 rounded-xl shadow-lg w-11/12 max-w-md mx-auto">
              <Link to="/against-friend" className="text-gray-700 text-xl md:text-2xl lg:text-3xl text-center block">Against Friend</Link>
            </div>
          </div>
          {/* Against Stockfish Engine */}
          <div className={`game-mode ${animate ? 'animate-slide-in delay-500' : ''}`}>
            <div className="bg-gray-200 bg-opacity-10 backdrop-filter backdrop-blur-xl border border-gray-500 p-2 md:p-4 lg:p-5 my-4 rounded-xl shadow-lg w-11/12 max-w-md mx-auto">
              <Link to="/against-stockfish" className="text-gray-700 text-xl md:text-2xl lg:text-3xl text-center block">Against Stockfish Engine</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameModeSelector;
