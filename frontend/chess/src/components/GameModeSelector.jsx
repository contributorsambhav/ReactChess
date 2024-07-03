import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ModeSelectorImage from '../assets/ModeSelectorImage.png';
import axios from "axios";

function GameModeSelector() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation after initial render
    setAnimate(true);
  }, []);

  function handleClick() {
    axios.get("http://localhost:8123/profile", {
      withCredentials: true // Send cookies with the request
    })
    .then(res => {
      const data = res.data;
      console.log(data);
      // Handle the response data as needed
    })
    .catch(error => {
      console.error('Error fetching profile:', error);
    });
  }

  return (
    <div className='flex h-screen items-center w-screen'>
      <div className='w-1/2 h-screen'></div>
      <div className="w-1/2 h-screen bg-cover bg-center relative overflow-hidden"
        style={{ backgroundImage: `url(${ModeSelectorImage})` }}>
        <div className='mt-16 transform w-full'>
          {/* Random Play */}
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

          {/* Check Login Status */}
          <div className="my-4 text-center">
            <button onClick={handleClick} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Check Login Status
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default GameModeSelector;
