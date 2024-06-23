import React from 'react';
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

function PieceArray() {
  return (
    <div className="mt-2 mb-6 flex flex-col items-center justify-center ">
      <div className="flex flex-row flex-wrap justify-center items-center aligin-baseline space-x-1 mb-4  space-y-2 rounded-lg shadow-lg">
        <img src={wB} width={30} alt="White Bishop" className="transform hover:scale-110 transition duration-300 ease-in-out" />
        <img src={wN} width={35} alt="White Knight" className="transform hover:scale-110 transition duration-300 ease-in-out" />
        <img src={wR} width={40} alt="White Rook" className="transform hover:scale-110 transition duration-300 ease-in-out" />
        <img src={wQ} width={45} alt="White Queen" className="transform hover:scale-110 transition duration-300 ease-in-out" />
        <img src={wK} width={50} alt="White King" className="transform hover:scale-110 transition duration-300 ease-in-out" />
        <img src={bK} width={50} alt="Black King" className="transform hover:scale-110 transition duration-300 ease-in-out" />
        <img src={bQ} width={45} alt="Black Queen" className="transform hover:scale-110 transition duration-300 ease-in-out" />
        <img src={bR} width={40} alt="Black Rook" className="transform hover:scale-110 transition duration-300 ease-in-out" />
        <img src={bN} width={35} alt="Black Knight" className="transform hover:scale-110 transition duration-300 ease-in-out" />
        <img src={bB} width={30} alt="Black Bishop" className="transform hover:scale-110 transition duration-300 ease-in-out" />
      </div>
    </div>
  );
}

export default PieceArray;
