import React from 'react';

function WaitQueue({ length = 2 }) {
  return (
    <div className="w-screen text-center align-middle flex flex-col items-center justify-center min-h-screen">
      <div className="text-2xl font-semibold text-gray-100">
        Waiting for {length - 1} more player(s) to join...
      </div>
    </div>
  );
}

export default WaitQueue;
