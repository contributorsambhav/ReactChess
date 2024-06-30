import React, { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import Chessboard from 'chessboardjs';
import socketIOClient from 'socket.io-client';

import bB from '../pieces/bB.png';
import bK from '../pieces/bK.png';
import bN from '../pieces/bN.png';
import bP from '../pieces/bP.png';
import bQ from '../pieces/bQ.png';
import bR from '../pieces/bR.png';
import wB from '../pieces/wB.png';
import wK from '../pieces/wK.png';
import wN from '../pieces/wN.png';
import wP from '../pieces/wP.png';
import wQ from '../pieces/wQ.png';
import wR from '../pieces/wR.png';

const pieceImages = {
  bB, bK, bN, bP, bQ, bR,
  wB, wK, wN, wP, wQ, wR,
};

const GlobalMultiplayer = () => {
  const chessRef = useRef(null); 
  const boardRef = useRef(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [moves, setMoves] = useState([]); 
  const [socket, setSocket] = useState(null)
const [game,setGame] = useState(null)
  useEffect(() => {
    const newgame = new Chess();
    setGame(newgame)
    const newSocket = socketIOClient('http://localhost:8123'); // Replace with your backend URL
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('move', ({ from, to }) => {
        try {
          const move = game.move({ from, to, promotion: 'q' });
          if (move) {
            boardRef.current.position(game.fen());
            updateStatus();
          }
        } catch (error) {
          console.error('Invalid move received:', error);
        }
      });

      boardRef.current = Chessboard(chessRef.current, {
        draggable: true,
        position: 'start',
        onDrop: onDrop,
        onMouseoverSquare: onMouseoverSquare,
        onMouseoutSquare: onMouseoutSquare,
        onSnapEnd: onSnapEnd,
        pieceTheme: (piece) => pieceImages[piece],
        snapbackSpeed: 500,
        snapSpeed: 100
      });
    }
  }, [socket]);

  const onDrop = (source, target) => {
    try {
      const move = game.move({ from: source, to: target, promotion: 'q' });
      if (move) {
        boardRef.current.position(game.fen());
        updateStatus();
        socket.emit('move', { from: source, to: target });
        setMoves(prevMoves => [...prevMoves, { from: move.from, to: move.to }]);
      } else {
        console.log('Invalid move:', source, target);
      }
    } catch (error) {
      console.error('Error making move:', error);
    }
  };

  const onMouseoverSquare = (square, piece) => {
    const moves = game.moves({ square, verbose: true });
    if (moves.length > 0) {
      greySquare(square);
      moves.forEach(move => greySquare(move.to));
    }
  };

  const onMouseoutSquare = () => {
    removeGreySquares();
  };

  const onSnapEnd = () => {
    boardRef.current.position(game.fen());
  };

  const updateStatus = () => {
    let status = '';
    if (game.isCheckmate()) {
      status = 'Game over, checkmate.';
    } else if (game.isDraw) {
      status = 'Game over, draw.';
    } else {
      let turn = 'White';
      if (game.turn() === 'b') {
        turn = 'Black';
      }
      status = `Turn: ${turn}`;
      
    }
    setCurrentStatus(status);
  };

  const removeGreySquares = () => {
    const squares = document.querySelectorAll('.square-55d63');
    squares.forEach(square => square.style.background = '');
  };

  const greySquare = (square) => {
    const squareEl = document.querySelector(`.square-${square}`);
    if (squareEl) {
      const isBlack = squareEl.classList.contains('black-3c85d');
      squareEl.style.background = isBlack ? '#696969' : '#a9a9a9';
    }
  };

  return (
    <div className='flex flex-col items-center h-screen'>
      <div className='w-screen flex mx-auto my-auto'>
        <div className='mx-16 w-1/2'>
          <div ref={chessRef} style={{ width: window.innerWidth > 1536 ? '40vw' : '70vw' }}></div>
        </div>
        <div className='ml-4 w-1/3'>
          <div className='rounded-xl text-center p-6 px-16 w-full text-2xl bg-green-700 text-white flex-shrink-0'>
            Current Status: {currentStatus ? currentStatus : "White to move"}
          </div>
          <div className='mt-4'>
            <table className='w-full border-collapse border border-gray-700 rounded-lg overflow-hidden'>
              <thead>
                <tr className='bg-gray-800 text-center text-white'>
                  <th className='border border-gray-700 px-6 py-3'>Move</th>
                  <th className='border border-gray-700 px-6 py-3'>From</th>
                  <th className='border border-gray-700 px-6 py-3'>To</th>
                </tr>
              </thead>
              <tbody>
                {moves.map((move, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-700 text-white text-center' : 'bg-gray-600 text-gray-200 text-center'}>
                    <td className='border border-gray-700 px-6 py-4'>{index + 1}</td>
                    <td className='border border-gray-700 px-6 py-4'>{move.from}</td>
                    <td className='border border-gray-700 px-6 py-4'>{move.to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalMultiplayer;
