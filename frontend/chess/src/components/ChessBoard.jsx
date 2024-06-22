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

    // Function to handle piece drop events
    const onDrop = (source, target) => {
      const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Automatically promote to a queen for simplicity
      });

      if (move === null) return 'snapback'; // If the move is illegal, snap the piece back

      // Update board position after the piece snap
      boardRef.current.position(game.fen());
    };

    // Configuration object for Chessboard.js
    const config = {
      draggable: true,
      position: 'start',
      onDrop: onDrop,
      dropOffBoard: 'snapback',
      pieceTheme: (piece) => pieceImages[piece]
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
    <div ref={chessRef} style={{ width: '700px' }}></div>
  );
};

export default ChessboardComponent;
