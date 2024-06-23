import React, { useEffect, useRef } from 'react';
import { Chess } from 'chess.js'; // Correct named import for Chess.js
import Chessboard from 'chessboardjs'; // Import Chessboard.js

// Import chess piece images
import bB from './pieces/bB.png';
import bK from './pieces/bK.png';
import bN from './pieces/bN.png';
import bP from './pieces/bP.png';
import bQ from './pieces/bQ.png';
import bR from './pieces/bR.png';
import wB from './pieces/wB.png';
import wK from './pieces/wK.png';
import wN from './pieces/wN.png';
import wP from './pieces/wP.png';
import wQ from './pieces/wQ.png';
import wR from './pieces/wR.png';

const pieceImages = {
  bB, bK, bN, bP, bQ, bR,
  wB, wK, wN, wP, wQ, wR,
};

const ChessboardComponent = () => {
  const chessRef = useRef(null); // Reference to the DOM element for the chessboard
  const boardRef = useRef(null); // Reference to the Chessboard instance

  useEffect(() => {
    const game = new Chess(); // Create a new Chess instance

    const onDragStart = (source, piece, position, orientation) => {
      // Do not pick up pieces if the game is over
      if (game.isGameOver()) {
        console.log("Game over");
        return false;
      }

      // Only pick up pieces for the side to move
      if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
          (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
      }
    };

    const onDrop = (source, target) => {
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

      } catch (error) {
        console.log(error);
        return "snapback";
      }

      updateStatus(); // Update the game status
    };

    // Update the board position after the piece snap for castling, en passant, pawn promotion
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
      } else if (game.isDraw()) {
        status = 'Game over, drawn position';
      } else {
        status = moveColor + ' to move';

        // Check?
        if (game.isCheck()) {
          status += ', ' + moveColor + ' is in check';
        }
      }

      // Update the status, FEN, and PGN
      console.log(status);
      console.log(game.fen());
      console.log(game.pgn());
    };

    const config = {
      draggable: true,
      position: 'start',
      onDragStart: onDragStart,
      onDrop: onDrop,
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
    <div ref={chessRef} className="mx-auto my-auto mt-20" style={{ width: window.innerWidth > 1536 ? '40vw' : '70vw' }}></div>
  );
};

export default ChessboardComponent;
