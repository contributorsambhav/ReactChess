import React from 'react';

function WaitQueue({ length = 2 }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-2xl font-semibold text-gray-800">
        Waiting for {length - 1} more player(s) to join...
      </div>
    </div>
  );
}

export default WaitQueue;
