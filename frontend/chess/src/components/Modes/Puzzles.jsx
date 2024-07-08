import React from 'react';
import { Link } from 'react-router-dom';


const Puzzles = () => {

  return (
    <div className="w-screen flex flex-col items-center h-screen bg-gray-100">
      <div className="w-full max-w-md mx-auto mt-10">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-700">Select a Puzzle</h1>
        <div className="grid grid-cols-1 text-gray-200 gap-4">
          <h3 className='text-gray-800 text-center'>THE BIG THREE (Hardest puzzles)</h3>
          <Link 
            to="/puzzle1" 
            className="text-gray-200 block w-full px-6 py-4 text-center hover:text-white bg-green-600 hover:bg-green-700 rounded-lg">
            Puzzle 1
          </Link>
          <Link 
            to="/puzzle2" 
            className="text-gray-200 block w-full px-6 py-4 text-center hover:text-white bg-green-600 hover:bg-green-700 rounded-lg">
            Puzzle 2
          </Link>
          <Link 
            to="/puzzle3" 
            className="text-gray-200 block w-full px-6 py-4 text-center hover:text-white bg-green-600 hover:bg-green-700 rounded-lg">
            Puzzle 3
          </Link>

          <h3 className='text-gray-900 text-center'>Mate in one move</h3>
          <Link 
            to="/puzzle4" 
            className="text-gray-200 block w-full px-6 py-4 text-center hover:text-white bg-green-600 hover:bg-green-700 rounded-lg">
            EASY
          </Link>
          <Link 
            to="/puzzle5" 
            className="text-gray-200 block w-full px-6 py-4 text-center hover:text-white bg-green-600 hover:bg-green-700 rounded-lg">
            NORMAL
          </Link>
          <Link 
            to="/puzzle5" 
            className="text-gray-200 block w-full px-6 py-4 text-center hover:text-white bg-green-600 hover:bg-green-700 rounded-lg">
            HARD
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Puzzles;
