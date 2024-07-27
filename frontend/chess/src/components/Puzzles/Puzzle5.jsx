import React, { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import Chessboard from 'chessboardjs';
import axios from 'axios';
import pieceImages from "../pieceImages";
import { Howl } from 'howler';
import moveSoundFile from '../../assets/sounds/move.mp3';
import captureSoundFile from '../../assets/sounds/capture.mp3';
import checkSoundFile from '../../assets/sounds/check.mp3';
import checkmateSoundFile from '../../assets/sounds/checkmate.mp3';
import bg from "../../assets/images/bgprofile.jpg";

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

// Initialize sound effects
const moveSound = new Howl({ src: [moveSoundFile] });
const captureSound = new Howl({ src: [captureSoundFile] });
const checkSound = new Howl({ src: [checkSoundFile] });
const checkmateSound = new Howl({ src: [checkmateSoundFile] });

const Puzzle5 = () => {
  const puzzleFEN = "r2q4/pb1r1k2/1p4RQ/2n1pN1B/2p1P3/2P5/PP6/1K3R2 w - - 6 33";

  const fetchBestMove = async (FEN) => {
    try {
      const response = await axios.get('http://localhost:8123/stockfish', {
        params: {
          fen: FEN,
          depth: 10
        }
      });
      console.log('Response from server:', response.data);
      return response.data.bestMove;
    } catch (error) {
      console.error('Error fetching move from stockfish:', error);
      return null;
    }
  };

  const chessRef = useRef(null);
  const boardRef = useRef(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [moves, setMoves] = useState([]);
  const gameRef = useRef(new Chess(puzzleFEN));
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  const [isVideoCollapsed, setIsVideoCollapsed] = useState(false);
  const [promotionPiece, setPromotionPiece] = useState('q');

  useEffect(() => {
    const game = gameRef.current;

    const onDragStart = (source, piece, position, orientation) => {
      if (game.isGameOver()) {
        console.log("Start a new game from the menu");
        return false;
      }

      if (game.turn() === 'b') {
        console.log("It's not White's turn");
        return false;
      }

      if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
      }
    };

    const onDrop = async (source, target) => {
      removeGreySquares();

      let move = game.move({
        from: source,
        to: target,
        promotion: promotionPiece // Use the selected promotion piece
      });

      if (move === null) return "snapback";

      setMoves(prevMoves => [...prevMoves, { from: move.from, to: move.to }]);
      updateStatus();

      // Play sound based on move type
      if (move.captured) {
        captureSound.play();
      } else {
        moveSound.play();
      }

      if (game.turn() === 'b') {
        try {
          const fen = game.fen();
          console.log(fen);

          const bestMoveResponse = await fetchBestMove(fen);

          if (bestMoveResponse) {
            console.log(bestMoveResponse);
            const bestMove = bestMoveResponse.split(' ')[1].trim();

            move = game.move({
              from: bestMove.slice(0, 2),
              to: bestMove.slice(2, 4),
              promotion: promotionPiece // Use the selected promotion piece
            });

            if (move !== null) {
              setMoves(prevMoves => [...prevMoves, { from: move.from, to: move.to }]);
              boardRef.current.position(game.fen());
              updateStatus();

              // Play sound based on move type
              if (move.captured) {
                captureSound.play();
              } else {
                moveSound.play();
              }
            }
          }
        } catch (error) {
          console.error("Error fetching move from stockfish:", error);
        }
      }
    };

    const onMouseoverSquare = (square, piece) => {
      const moves = game.moves({
        square: square,
        verbose: true
      });

      if (moves.length === 0) return;

      greySquare(square);

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

    const updateStatus = debounce(() => {
      let status = '';
      let moveColor = 'White';

      if (game.turn() === 'b') {
        moveColor = 'Black';
      }

      if (game.isGameOver()) {
        status = 'Game over';
        checkmateSound.play();
      } else {
        status = moveColor + ' to move';

        if (game.isCheckmate()) {
          status += ', ' + moveColor + ' is in check';
          checkSound.play();
        }
      }

      setCurrentStatus(status);
    }, 100);

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
      position: puzzleFEN,
      onDragStart: onDragStart,
      onDrop: onDrop,
      onMouseoverSquare: onMouseoverSquare,
      onMouseoutSquare: onMouseoutSquare,
      onSnapEnd: onSnapEnd,
      pieceTheme: (piece) => pieceImages[piece],
      snapbackSpeed: 500,
      snapSpeed: 100
    };

    boardRef.current = Chessboard(chessRef.current, config);

    return () => {
      if (boardRef.current) {
        boardRef.current.destroy();
      }
    };
  }, [puzzleFEN, promotionPiece]);

  const toggleTable = () => {
    setIsTableCollapsed(!isTableCollapsed);
  };

  const toggleVideo = () => {
    setIsVideoCollapsed(!isVideoCollapsed);
  };

  const handlePromotionChange = (e) => {
    setPromotionPiece(e.target.value);
  };

  return (
    <div className='w-full flex flex-col items-center min-min-h-screen'
    style={{ backgroundImage: `url(${bg})`, backgroundSize: "contain" }}
    >
      <h1 className='text-3xl font-bold mt-16 z-10 lg:mt-4'>Mate in one move (normal)</h1>
      <div className='w-[80%] p-4 text-lg'>
       
      </div>
      <div className='w-screen flex lg:flex-row flex-col lg:flex-row mx-auto my-auto'>
        <div className='lg:mx-16 w-full lg:w-1/2'>
          <div ref={chessRef} style={{ width: window.innerWidth > 1028 ? '40vw' : '100vw' }}></div>
        </div>
        <div className='lg:ml-4 w-full lg:w-1/3 mt-4 lg:mt-0'>
          <div className='rounded-xl text-center p-6 px-16 w-full text-2xl bg-green-700 text-white flex-shrink-0'>
            Current Status: {currentStatus ? currentStatus : "White to move"}
          </div>
          <div className='mt-4'>
            <label className='mr-2 text-white'>Promotion Piece:</label>
            <select value={promotionPiece} onChange={handlePromotionChange} className='bg-green-700 text-white px-4 py-2 rounded-lg w-full'>
              <option value="q">Queen</option>
              <option value="r">Rook</option>
              <option value="b">Bishop</option>
              <option value="n">Knight</option>
            </select>
          </div>
          <button onClick={toggleTable} className='mt-4 bg-green-700 text-white px-4 py-2 rounded-t-lg w-full'>
            {isTableCollapsed ? 'Show Moves' : 'Hide Moves'}
          </button>
          <div style={{ maxHeight: isTableCollapsed ? '0' : '40vh', transition: 'max-height 0.3s ease-in-out', overflow: 'scroll' }}>
            <div style={{ height: '100%', overflowY: 'auto' }}>
              <table className='w-full border-collapse border border-gray-700 rounded-lg'>
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
          <button onClick={toggleVideo} className='mt-4 bg-green-700 text-white px-4 py-2 rounded-t-lg w-full'>
            {isVideoCollapsed ? 'Hide Solution' : 'Show Solution'}
          </button>
          {isVideoCollapsed && (
            <div className='text-2xl mt-2 text-center'>Rook anywhere between g1 to g5</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Puzzle5;
