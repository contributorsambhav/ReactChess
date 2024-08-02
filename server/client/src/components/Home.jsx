import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Typing from 'react-typing-effect';
import bgImage from '../assets/images/bgImage.jpg';
import "./home.css"
function Home() {
  const authStatus = useSelector(state => state.auth.status);
  const userData = useSelector(state => state.auth.userData);

  return (
    <div
      className="w-screen min-h-screen flex items-center justify-center"
      style={{ 
        backgroundImage: `url(${bgImage})`, 
        backgroundSize: 'cover', 
        backgroundRepeat: 'no-repeat', 
        backgroundPosition: 'center' 
      }}
    >
      <div className="font-serif tracking-wide bg-gray-800 flex flex-col bg-opacity-30 backdrop-filter backdrop-blur-xl border border-gray-500 p-8 rounded-xl shadow-lg text-center w-11/12 lg:w-2/3 lg:w-1/2 xl:w-1/2 h-fit h/2/3 lg:h-fit">
        <h1 className="text-3xl lg:text-5xl tracking-normal font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4 ">
          <Typing 
            text={['Welcome to Chess Master']} 
            speed={100} 
            eraseSpeed={50} 
            typingDelay={200} 
            eraseDelay={5000}
          />
        </h1>

        <div className='description text-center align-middle h-2/3 text-md md:text-xl lg:text-2xl text-gray-100 mb-4'>
        
            Experience the ultimate chess journey with Chess Master. Challenge your friends in local multiplayer, or take on global opponents with our advanced socket integration. Sharpen your skills with intricate puzzles, or test your strategies against Stockfish, the world’s strongest chess engine. For those moments of frustration, switch to "Always Win" mode and enjoy a flawless victory every time.
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {authStatus === "true" && userData.username? (
            <>'
              <Link to="/modeselector" className="block bg-green-400 bg-opacity-40 text-white py-3 px-6 rounded-lg text-lg lg:text-2xl w-full  hover:bg-opacity-50 transition duration-300 border border-white hover:bg-gray300 hover:text-yellow-400 transform transition duration-300 hover:scale-105">
                Continue 
              </Link>
              
            </>
          ) : (
            <>
              <Link to="/login" className="block bg-gray-400 bg-opacity-40 text-white py-3 px-6 rounded-lg text-lg lg:text-2xl w-full lg:w-1/2 hover:bg-opacity-50 transition duration-300 border border-white hover:bg-gray-300 hover:text-blue-200 transform transition duration-300 hover:scale-105">
                Login
              </Link>
              <Link to="/signup" className="block bg-gray-400 bg-opacity-40 text-white py-3 px-6 rounded-lg text-lg lg:text-2xl w-full lg:w-1/2 hover:bg-opacity-50 transition duration-300 border border-white hover:bg-gray-300 hover:text-blue-200 transform transition duration-300 hover:scale-105">
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
