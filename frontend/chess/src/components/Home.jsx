import React from 'react';
import bgImage from '../assets/bgImage.jpg';

function Home() {
  return (
    <div
      className="w-screen h-screen"
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
    >
    </div>
  );
}

export default Home;
