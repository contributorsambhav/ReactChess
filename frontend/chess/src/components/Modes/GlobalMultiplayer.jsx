import React, { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import Chessboard from 'chessboardjs';
import socketIOClient from 'socket.io-client';
import { useSelector } from 'react-redux';
import WaitQueue from '../WaitQueue';
import { useNavigate } from 'react-router-dom';
import pieceImages from '../pieceImages';
import axios from 'axios';

const GlobalMultiplayer = () => {
  const addMatchToHistory = async (userId, opponent, status) => {
    try {
      console.log('Sending data:', { userId, opponent: opponent.username, status });
      const response = await axios.post(`http://localhost:8123/user/${userId}/match-history`, {
        opponent: opponent.username,
        status,
      });
      console.log('Match history added:', response.data);
    } catch (error) {
      console.error('Error adding match to history:', error.response?.data || error.message);
    }
  };

  const user = useSelector((state) => state.auth.userData);
  const chessRef = useRef(null);
  const boardRef = useRef(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [moves, setMoves] = useState([]);
  const [socket, setSocket] = useState(null);
  const [game, setGame] = useState(null);
  const [gameCreated, setGameCreated] = useState(false);
  const [playerColor, setPlayerColor] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const newGame = new Chess();
    setGame(newGame);
    const newSocket = socketIOClient('http://localhost:8123', {
      query: { user: JSON.stringify(user) }
    });
    setSocket(newSocket);

    newSocket.on('color', (color) => {
      setPlayerColor(color);
      setGameCreated(true);
    });

    newSocket.on('opponent', (opponent) => {
      setOpponent(opponent);
    });

    return () => newSocket.disconnect();
  }, [user]);

  useEffect(() => {
    if (socket && gameCreated) {
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

      socket.on('opponentDisconnected', () => {
        alert('Opponent has been disconnected');
        navigate('/modeselector');
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
        snapSpeed: 100,
        orientation: playerColor
      });
    }
  }, [socket, gameCreated, game, playerColor]);

  const onDrop = (source, target) => {
    if ((playerColor === 'white' && game.turn() === 'w') || (playerColor === 'black' && game.turn() === 'b')) {
      try {
        const move = game.move({ from: source, to: target, promotion: 'q' });
        if (move) {
          boardRef.current.position(game.fen());
          updateStatus();
          socket.emit('move', { from: source, to: target });
          setMoves((prevMoves) => [...prevMoves, { from: move.from, to: move.to }]);
        } else {
          console.log('Invalid move:', source, target);
        }
      } catch (error) {
        console.error('Error making move:', error);
      }
    } else {
      console.log('Not your turn');
    }
  };

  const onMouseoverSquare = (square, piece) => {
    const moves = game.moves({ square, verbose: true });
    if (moves.length > 0) {
      greySquare(square);
      moves.forEach((move) => greySquare(move.to));
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
    let turn = 'White';

    if (game.turn() === 'b') {
      turn = 'Black';
    }

    if (game.isCheckmate()) {
      if (turn === 'White') {
        status = 'Game over, Black wins by checkmate.';
        if (playerColor === "white"){
          addMatchToHistory(user.userId, opponent, 'lose');
        }else{
          addMatchToHistory(user.userId, opponent, 'win');
        }
      } else {
        status = 'Game over, White wins by checkmate.';
        if (playerColor === "black"){
          addMatchToHistory(user.userId, opponent, 'lose');
        }else{
          addMatchToHistory(user.userId, opponent, 'win');
        }
      }
    } else if (game.isDraw()) {
      status = 'Game over, draw.';
      addMatchToHistory(user.userId, opponent, 'draw');
    } else {
      status = `${turn} to move`;
    }

    setCurrentStatus(status);
  };

  const removeGreySquares = () => {
    const squares = document.querySelectorAll('.square-55d63');
    squares.forEach((square) => (square.style.background = ''));
  };

  const greySquare = (square) => {
    const squareEl = document.querySelector(`.square-${square}`);
    if (squareEl) {
      const isBlack = squareEl.classList.contains('black-3c85d');
      squareEl.style.background = isBlack ? '#696969' : '#a9a9a9';
    }
  };

  return (
    <>
      {!gameCreated ? (
        <WaitQueue />
      ) : (
        <div className='flex flex-col items-center h-screen'>
          <div className='w-screen flex mx-auto my-auto'>
            <div className='mx-16 w-1/2'>
              {opponent && (
                <div className="flex justify-between text-center text-xl mb-4">
                  <p>Opponent: {opponent.username}</p>
                  <p>Rating- : {((opponent.wins+opponent.loses)/200)*2800}</p>
                </div>
              )}
              <div id='myBoard' ref={chessRef} style={{ width: window.innerWidth > 1536 ? '40vw' : '70vw' }}></div>
            </div>
            <div className='ml-4 w-1/3'>
              <div className='rounded-xl text-center p-6 px-16 w-full text-2xl bg-green-700 text-white flex-shrink-0'>
                Current Status: {currentStatus ? currentStatus : 'White to move'}
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
      )}
    </>
  );
};

export default GlobalMultiplayer;
