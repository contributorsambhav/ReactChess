import React, { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import Chessboard from 'chessboardjs';

// Import chess piece images
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

const ChessboardComponent = () => {
  const chessRef = useRef(null); // Reference to the DOM element for the chessboard
  const boardRef = useRef(null); // Reference to the Chessboard instance
  const [currentStatus, setCurrentStatus] = useState(null); // State to hold the current game status
  const [moves, setMoves] = useState([]); // State to hold the list of moves

  useEffect(() => {
    const game = new Chess(); // Create a new Chess instance

    const onDragStart = (source, piece, position, orientation) => {
      // Do not pick up pieces if the game is over
      if (game.isGameOver()) {
        console.log("Start a new game from the menu");
        return false;
      }

      // Only pick up pieces for the side to move
      if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
      }
    };

    const makeRandomMove = () => {
      if (game.isGameOver()) return;

      let possibleMoves = game.moves();

      // Filter out non-legal moves for black
      possibleMoves = possibleMoves.filter(move => move.includes('b'));

      // Randomly select a move
      const randomIdx = Math.floor(Math.random() * possibleMoves.length);
      try {
        game.move(possibleMoves[randomIdx]);

      
      boardRef.current.position(game.fen());

      // Update moves state with the latest move
      setMoves(prevMoves => [...prevMoves, { from: possibleMoves[randomIdx].split('-')[0], to: possibleMoves[randomIdx].split('-')[1] }]);
    } catch (error) {
        setCurrentStatus("Black says :Help me move please in am overwhelmed")
      } 
    };

    const onDrop = (source, target) => {
      removeGreySquares();

      try {
        let move = game.move({
          from: source,
          to: target,
          promotion: 'q' // Automatically promote to a queen for simplicity
        });

        // Log the move result
        console.log("The move returns: " + JSON.stringify(move));

        // If the move is illegal, return 'snapback'
        if (move === null) return "snapback";

        // Update moves state with the latest move
        setMoves(prevMoves => [...prevMoves, { from: move.from, to: move.to }]);
      } catch (error) {
        console.log(error);
        return "snapback";
      }

      updateStatus(); // Update the game status

      // After white's move, make random move for black
      if (game.turn() === 'b') {
        setTimeout(makeRandomMove, 250);
      }
    };

    const onMouseoverSquare = (square, piece) => {
      // Get list of possible moves for this square
      const moves = game.moves({
        square: square,
        verbose: true
      });

      // Exit if there are no moves available for this square
      if (moves.length === 0) return;

      // Highlight the square they moused over
      greySquare(square);

      // Highlight the possible squares for this piece
      for (let i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
      }
    };

    const onMouseoutSquare = (square, piece) => {
      removeGreySquares();
    };

    const onSnapEnd = () => {
      boardRef.current.position(game.fen());
    };

    const updateStatus = () => {
      let status = '';
      let moveColor = 'White';

      if (game.turn() === 'b') {
        moveColor = 'Black';
      }

      // Checkmate?
      if (game.isCheckmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
      }  else {
        status = moveColor + ' to move';      
      }

      // Update the status
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

    const config = {
      draggable: true,
      position: 'start',
      onDragStart: onDragStart,
      onDrop: onDrop,
      onMouseoverSquare: onMouseoverSquare,
      onMouseoutSquare: onMouseoutSquare,
      onSnapEnd: onSnapEnd,
      pieceTheme: (piece) => pieceImages[piece],
      snapbackSpeed: 500,
      snapSpeed: 100
    };

    // Initialize Chessboard.js
    boardRef.current = Chessboard(chessRef.current, config);

    // Cleanup function to destroy the chessboard instance
    return () => {
      if (boardRef.current) {
        boardRef.current.destroy();
      }
    };
  }, []);

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

export default ChessboardComponent;
