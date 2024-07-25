import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Typing from 'react-typing-effect';
import bgImage from '../assets/images/bgImage.jpg';

function Home() {
  const authStatus = useSelector(state => state.auth.status);

  return (
    <div
      className="w-screen h-screen flex items-center justify-center"
      style={{ 
        backgroundImage: `url(${bgImage})`, 
        backgroundSize: 'cover', 
        backgroundRepeat: 'no-repeat', 
        backgroundPosition: 'center' 
      }}
    >
      <div className="font-serif tracking-wide bg-gray-800 flex flex-col bg-opacity-30 backdrop-filter backdrop-blur-xl border border-gray-500 p-8 rounded-xl shadow-lg text-center w-1/2 h-1/2">
        <h1 className="text-5xl tracking-normal font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-6">
          <Typing 
            text={['Welcome to Chess Master']} 
            speed={100} 
            eraseSpeed={50} 
            typingDelay={200} 
            eraseDelay={5000}
          />
        </h1>

        <div className='description text-center align-middle h-2/3 text-2xl text-gray-100 mb-6'>
          <Typing
            text={['Experience the ultimate chess journey with Chess Master. Challenge your friends in local multiplayer, or take on global opponents with our advanced socket integration. Sharpen your skills with intricate puzzles, or test your strategies against Stockfish, the world’s strongest chess engine. For those moments of frustration, switch to "Always Win" mode and enjoy a flawless victory every time.']}
            speed={50}
            eraseDelay={1000000000} // effectively prevents erasing
          />
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {authStatus === "true" ? (
            <>
              <Link to="/local-multiplayer" className="block bg-blue-400 bg-opacity-40 text-white py-3 px-6 rounded-lg text-2xl w-1/3 hover:bg-opacity-50 border border-white">
                Local Multiplayer
              </Link>
              <Link to="/global-multiplayer" className="block bg-blue-400 bg-opacity-40 text-white py-3 px-6 rounded-lg text-2xl w-1/3 hover:bg-opacity-50 border border-white">
                Global Multiplayer
              </Link>
              <Link to="/puzzle" className="block bg-blue-400 bg-opacity-40 text-white py-3 px-6 rounded-lg text-2xl w-1/3 hover:bg-opacity-50 border border-white">
                Puzzles
              </Link>
              <Link to="/against-stockfish" className="block bg-blue-400 bg-opacity-40 text-white py-3 px-6 rounded-lg text-2xl w-1/3 hover:bg-opacity-50 border border-white">
                Against Stockfish
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="block bg-blue-400 bg-opacity-40 text-white py-3 px-6 rounded-lg text-2xl w-1/2 hover:bg-opacity-50 border border-white">
                Login
              </Link>
              <Link to="/signup" className="block bg-blue-400 bg-opacity-40 text-white py-3 px-6 rounded-lg text-2xl w-1/2 hover:bg-opacity-50 border border-white">
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
