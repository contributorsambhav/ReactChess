import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Auth/Login';
import Home from './components/Home';
import SignUp from './components/Auth/SignUp';
import GameModeSelector from './components/GameModeSelector';
import RandomPlay from './components/Modes/RandomPlay';
import LocalMultiplayer from './components/Modes/LocalMultiplayer';
import GlobalMultiplayer from './components/Modes/GlobalMultiplayer';
import AgainstStockfish from './components/Modes/AgainstStockfish';
import { Provider } from 'react-redux';
import store from './store/store';
import Profile from './components/Profile';

import Puzzles from './components/Modes/Puzzles';
import Puzzle1 from './components/Puzzles/Puzzle1';
import Puzzle2 from './components/Puzzles/Puzzle2';
import Puzzle3 from './components/Puzzles/Puzzle3';
import Puzzle4 from './components/Puzzles/Puzzle4';
import Puzzle5 from './components/Puzzles/Puzzle5';
import Puzzle6 from './components/Puzzles/Puzzle6';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className='w-[100vw] h-fit '>
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

            <Route path="/puzzle1" element={<Puzzle1 />} />
            <Route path="/puzzle2" element={<Puzzle2 />} />
            <Route path="/puzzle3" element={<Puzzle3 />} />
            <Route path="/puzzle4" element={<Puzzle4 />} />
            <Route path="/puzzle5" element={<Puzzle5 />} />
            <Route path="/puzzle6" element={<Puzzle6 />} />

          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
