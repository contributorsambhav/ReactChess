import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import AgainstStockfish from './components/Modes/AgainstStockfish';
import GameModeSelector from './components/GameModeSelector';
import GlobalMultiplayer from './components/Modes/GlobalMultiplayer';
import Home from './components/Home';
import LocalMultiplayer from './components/Modes/LocalMultiplayer';
import Login from './components/Auth/Login';
import Navbar from './components/Navbar';
import Profile from './components/Profile';
import { Provider } from 'react-redux';
import Puzzle from './components/Puzzles/Puzzle';
import Puzzles from './components/Modes/Puzzles';
import RandomPlay from './components/Modes/RandomPlay';
import React from 'react';
import SignUp from './components/Auth/SignUp';
import store from './store/store';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className='w-[100vw] h-fit'>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/modeselector" element={<GameModeSelector />} />
            <Route path="/profile" element={<Profile />} />

            <Route path="/random-play" element={<RandomPlay />} />
            <Route path="/local-multiplayer" element={<LocalMultiplayer />} />
            <Route path="/global-multiplayer" element={<GlobalMultiplayer />} />
            <Route path="/puzzle" element={<Puzzles />} />
            <Route path="/against-stockfish" element={<AgainstStockfish />} />

            <Route path="/puzzle/:puzzleId" element={<Puzzle />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;