import React, { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import Chessboard from 'chessboardjs';
import socketIOClient from 'socket.io-client';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import pieceImages from '../pieceImages';
import axios from 'axios';

const Championship = () => {
    const addMatchToHistory = async (userId, opponentName, status) => {
        try {
            console.log('Sending data:', { userId, opponentName, status });
            const response = await axios.post(`http://localhost:8123/user/${userId}/match-history`, {
                opponent: opponentName,
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
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        if (!user){
            axios.get("http://localhost:8123/profile", {
            withCredentials: true
        })
            .then(res => {
                const data = res.data;
                
                console.log(data);
                user = data
            })
            .catch(error => { 
                console.error('Error fetching profile:', error);
            });
        }
        const newGame = new Chess();
        setGame(newGame);
        const newSocket = socketIOClient('http://localhost:8123/championship', {
            query: { user: JSON.stringify(user) }
        });
        setSocket(newSocket);

        newSocket.on('color', (color) => {
            setPlayerColor(color);
            setGameCreated(true);
        });

        newSocket.on("list", (data) => {
            console.log("list called");
            console.log(data);
            if (data) {
                setPlayers(data);
            }
        });

        newSocket.on('opponent', (obtainedOpponent) => {
            console.log(obtainedOpponent);
            setOpponent(obtainedOpponent);
        });

        return () => newSocket.disconnect();
    }, [user]);

    useEffect(() => {
        if (opponent) {
            console.log(opponent);
        }
    }, [opponent]);

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

            socket.on("list", (data) => {
                console.log(data);
                setPlayers(data.user);
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
                if (playerColor === "white" && opponent) {
                    addMatchToHistory(user.userId, opponent.username, 'lose');
                } else if (opponent) {
                    addMatchToHistory(user.userId, opponent.username, 'win');
                }
            } else {
                status = 'Game over, White wins by checkmate.';
                if (playerColor === "black" && opponent) {
                    addMatchToHistory(user.userId, opponent.username, 'lose');
                } else if (opponent) {
                    addMatchToHistory(user.userId, opponent.username, 'win');
                }
            }
        } else if (game.isDraw()) {
            status = 'Game over, draw.';
            if (opponent) {
                addMatchToHistory(user.userId, opponent.username, 'draw');
            }
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

    const calculateRating = (wins, loses, draws) => {
        const totalGames = wins + loses + draws;
        if (totalGames === 0) return 0;
        const winRatio = wins / totalGames;
        const baseRating = 900;
        return Math.round(baseRating + (winRatio * 2100));
    };

    return (
        <>
            <div className='flex flex-col w-screen lg:flex-row justify-center items-center h-screen'>
                
                <div className='lg:w-1/3 w-full p-4'>
                    <div className='bg-gray-800 p-4 rounded-lg text-white'>
                        <h2 className='text-xl mb-4'>Players Waiting for a Match</h2>
                        <ul className='list-disc pl-5'>
                            {players.map((player, index) => (
                                <li key={index}>
                                    {player.username} - Rating: {calculateRating(player.wins, player.loses, player.draws)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className='lg:w-1/2 w-full flex flex-col items-center'>
                    <div className='w-full flex flex-col lg:flex-row justify-center items-center'>
                        <div className='lg:w-1/2 w-full flex flex-col items-center'>
                            {opponent && (
                                <div className="flex justify-between text-center text-xl mb-4">
                                    <p>Opponent: {opponent.username}</p>
                                    <p>Rating: {calculateRating(opponent.wins, opponent.loses, opponent.draws)}</p>
                                </div>
                            )}
                            <div id='myBoard' ref={chessRef} className='w-full lg:w-[40vw]'></div>
                            {user && (
                                <div className="flex justify-between text-center text-xl mb-4 mt-4 lg:mt-0">
                                    <p>You ({user.username})</p>
                                    <p>Rating: {calculateRating(user.wins, user.loses, user.draws)}</p>
                                </div>
                            )}
                        </div>
                        <div className='lg:w-1/3 w-full mt-4 lg:mt-0 flex flex-col items-center'>
                            <div className='rounded-xl text-center p-6 px-16 w-full text-2xl bg-green-700 text-white'>
                                Current Status: {currentStatus ? currentStatus : 'White to move'}
                            </div>
                            <div className='mt-4 w-full'>
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

            </div>
        </>
    );
};

export default Championship;
