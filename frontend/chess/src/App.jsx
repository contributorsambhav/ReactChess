import React from 'react';
import './App.css';
import Board from './components/ChessBoard';

function App() {
  return (
    <div className="w-full flex mx-[5vw] 2xl:flex-row flex-col ">
      <div className='mx-auto align-middle justify-center h-[100vh]'>
        <div className='my-auto'>
          <Board />
        </div>
      </div>
      <div className='w-[40vw] min-h-screen'>
        Spade for move table
      </div>
    </div>
  );
}

export default App;
