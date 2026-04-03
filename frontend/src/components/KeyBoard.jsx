// Keyboard component
// Responsible for rendering on-screen Wordle-style keyboard
// Props:
// keyPressed         -> function called whenever a key is clicked
// keyboardKeysRefs  -> useRef([]) array storing DOM references of every key button
// keyboard_keys     -> array like ['Q','W','E',...,'Z','Enter','Backspace']

function KeyBoard({ keyPressed, keyboardKeysRefs, keyboard_keys }) {
  if (keyboardKeysRefs.current.length !== keyboard_keys.length) {
    keyboardKeysRefs.current = Array(keyboard_keys.length);
  }

  return (
    <div className="keyboard-shell h-full w-full max-w-[100vw] overflow-x-hidden px-1">
      <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
        {keyboard_keys.slice(0, 10).map((keyboard_key, idx) => (
          <button
            key={idx}
            ref={(el) => (keyboardKeysRefs.current[idx] = el)}
            className="aspect-[0.78/1] min-w-0 w-full max-w-full rounded-md border border-gray-700 bg-neutral-500 px-0 py-0 text-sm font-bold text-zinc-200 focus:outline-none sm:rounded-lg sm:text-base"
            onClick={() => keyPressed(keyboard_key)}
          >
            {keyboard_key}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-2 grid w-[90%] grid-cols-9 gap-1 sm:gap-1.5">
        {keyboard_keys.slice(10, 19).map((keyboard_key, idx) => (
          <button
            key={idx + 10}
            ref={(el) => (keyboardKeysRefs.current[idx + 10] = el)}
            className="aspect-[0.78/1] min-w-0 w-full max-w-full rounded-md border border-gray-700 bg-neutral-500 px-0 py-0 text-sm font-bold text-zinc-200 focus:outline-none sm:rounded-lg sm:text-base"
            onClick={() => keyPressed(keyboard_key)}
          >
            {keyboard_key}
          </button>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-10 gap-1 sm:gap-1.5">
        {keyboard_keys.slice(19).map((keyboard_key, idx) => (
          <button
            key={idx + 19}
            ref={(el) => (keyboardKeysRefs.current[idx + 19] = el)}
            onClick={() => keyPressed(keyboard_key)}
            className={`min-w-0 w-full max-w-full rounded-md border border-gray-700 bg-neutral-500 font-bold text-zinc-200 focus:outline-none sm:rounded-lg ${
              idx === 0 || idx === 8
                ? "col-span-2 aspect-[1.45/1] px-1 text-[10px] sm:text-xs"
                : "col-span-1 aspect-[0.78/1] px-0 py-0 text-sm sm:text-base"
            }`}
          >
            {keyboard_key}
          </button>
        ))}
      </div>
    </div>
  );
}

export default KeyBoard;
