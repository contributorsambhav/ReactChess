import React from "react";

const MobileToggle = ({ mobileMode, onChange, className = "" }) => {
  return (
    <div className={`flex items-center justify-center lg:justify-start ${className}`}>
      <label className="flex items-center gap-3 cursor-pointer bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3 rounded-lg hover:bg-white/20 transition-all duration-200 shadow-lg">
        <input
          type="checkbox"
          checked={mobileMode}
          onChange={onChange}
          className="w-5 h-5 cursor-pointer accent-green-500"
        />
        <span className="text-white font-medium text-base lg:text-lg select-none">
          {mobileMode ? "Touch Mode (Click to Move)" : "Drag Mode"}
        </span>
      </label>
    </div>
  );
};

export default MobileToggle;