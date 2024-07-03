import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Auth/Login';
import Home from './components/Home';
import SignUp from './components/Auth/SignUp';
import GameModeSelector from './components/GameModeSelector';

//Modes Import
import RandomPlay from './components/Modes/RandomPlay';
import LocalMultiplayer from './components/Modes/LocalMultiplayer';
import GlobalMultiplayer from './components/Modes/GlobalMultiplayer';
import AgainstFriend from './components/Modes/AgainstFriend';
import AgainstStockfish from './components/Modes/AgainstStockfish';
import { Provider } from 'react-redux';
import store from './store/store';
import Profile from './components/Profile';

function App() {
  return (
    <>
    <Provider store={store}>

      <Router>
        <div>
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
            <Route path="/against-friend" element={<AgainstFriend />} />
            <Route path="/against-stockfish" element={<AgainstStockfish />} />

          </Routes>
        </div>
      </Router>
      </Provider>

    </>
  );
}

export default App;
