// import { useEffect, useState, useRef } from "react";

// keyPressed: function to handle key press actions
// keysRefs: ref to hold references to each keyboard button DOM node
// keyboard_keys: array of keys like ['Q', 'W', 'E', ..., 'Z', 'Enter', 'Backspace']
function KeyBoard({ keyPressed, keysRefs, keyboard_keys }) {

  // Ensure the keysRefs array has the correct length matching keyboard_keys
  if (keysRefs.current.length !== keyboard_keys.length) {
    keysRefs.current = Array(keyboard_keys.length);
  }

  return (
    <div className="w-full h-50">
      {/* First row of keyboard (0–9) */}
      <div className="flex justify-evenly">
        {keyboard_keys.slice(0, 10).map((keyboard_key, idx) => (
          <div key={idx}>
            <button
              ref={(el) => (keysRefs.current[idx] = el)} // Save reference to the button at index idx
              className="h-15 w-11 text-zinc-200 text-xl font-bold bg-neutral-500 border border-gray-700 rounded focus:outline-none"
              onClick={() => keyPressed(keyboard_key)} // Trigger the key press handler
            >
              {keyboard_key}
            </button>
          </div>
        ))}
      </div>

      {/* Second row of keyboard (10–18) */}
      <div className="flex justify-evenly mt-2 ml-5 mr-5">
        {keyboard_keys.slice(10, 19).map((keyboard_key, idx) => (
          <div key={idx + 10}>
            <button
              ref={(el) => (keysRefs.current[idx + 10] = el)} // Save reference to the button at index (idx + 10)
              className="h-15 w-11 text-zinc-200 text-xl font-bold bg-neutral-500 border border-gray-700 rounded focus:outline-none"
              onClick={() => keyPressed(keyboard_key)}
            >
              {keyboard_key}
            </button>
          </div>
        ))}
      </div>

      {/* Third row of keyboard (19 onwards), includes 'Enter' and 'Backspace' */}
      <div className="flex justify-evenly mt-2">
        {keyboard_keys.slice(19).map((keyboard_key, idx) => (
          <div key={idx + 19}>
            <button
              ref={(el) => (keysRefs.current[idx + 19] = el)} // Save reference to the button at index (idx + 19)
              onClick={() => keyPressed(keyboard_key)}
              className={
                idx === 0 || idx === 8 // Special styling for 'Enter' and 'Backspace'
                  ? "h-15 w-16 text-zinc-200 text-md font-bold bg-neutral-500 border border-gray-700 rounded focus:outline-none"
                  : "h-15 w-11 text-zinc-200 text-xl font-bold bg-neutral-500 border border-gray-700 rounded focus:outline-none"
              }
            >
              {keyboard_key}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default KeyBoard;
