import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Home from './components/Home';
import SignUp from './components/SignUp';
import ChessboardComponent from './components/ChessBoard';
import GameModeSelector from './components/GameModeSelector';
import ChessdbMode from './components/ChessdbMode';

function App() {
  return (
    <>
      <Router>
        <div>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/modeselector" element={<GameModeSelector />} />
            <Route path="/against-stockfish" element={<ChessdbMode />} />
            <Route path="/local-multiplayer" element={<ChessdbMode />} />

          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
