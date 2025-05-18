// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import Game from './Game';
import Multiplayer from './Multiplayer';


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/game" element={<Game />} />
        <Route path="/room" element={<Multiplayer />} />
      </Routes>
    </Router>
  );
}
