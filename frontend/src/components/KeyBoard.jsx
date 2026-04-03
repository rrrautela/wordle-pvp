// Keyboard component
// Responsible for rendering on-screen Wordle-style keyboard
// Props:
// keyPressed         -> function called whenever a key is clicked
// keyboardKeysRefs  -> useRef([]) array storing DOM references of every key button
// keyboard_keys     -> array like ['Q','W','E',...,'Z','Enter','Backspace']

function KeyBoard({
  keyPressed,
  keyboardKeysRefs,
  keyboard_keys,
  letterStates = {},
}) {
  if (keyboardKeysRefs.current.length !== keyboard_keys.length) {
    keyboardKeysRefs.current = Array(keyboard_keys.length);
  }

  function getKeyClasses(key) {
    const status = letterStates[key];
    if (status === "correct") return "bg-green-800 border-green-900";
    if (status === "present") return "bg-yellow-600 border-yellow-700";
    if (status === "absent") return "bg-zinc-700 border-zinc-800";
    return "bg-neutral-500 border-gray-700";
  }

  return (
    <div className="keyboard-shell h-full w-full max-w-[100vw] overflow-x-hidden px-1">
      <div className="flex justify-center gap-[6px]">
        {keyboard_keys.slice(0, 10).map((keyboard_key, idx) => (
          <button
            key={idx}
            ref={(el) => (keyboardKeysRefs.current[idx] = el)}
            className={`h-[44px] w-[8.4vw] max-w-[42px] min-w-[28px] rounded-md border px-0 py-0 text-sm font-bold text-zinc-200 focus:outline-none sm:h-[52px] sm:w-[40px] sm:max-w-[40px] sm:rounded-lg sm:text-base ${getKeyClasses(
              keyboard_key,
            )}`}
            onClick={() => keyPressed(keyboard_key)}
          >
            {keyboard_key}
          </button>
        ))}
      </div>

      <div className="mt-2 flex justify-center gap-[6px]">
        {keyboard_keys.slice(10, 19).map((keyboard_key, idx) => (
          <button
            key={idx + 10}
            ref={(el) => (keyboardKeysRefs.current[idx + 10] = el)}
            className={`h-[44px] w-[8.4vw] max-w-[42px] min-w-[28px] rounded-md border px-0 py-0 text-sm font-bold text-zinc-200 focus:outline-none sm:h-[52px] sm:w-[40px] sm:max-w-[40px] sm:rounded-lg sm:text-base ${getKeyClasses(
              keyboard_key,
            )}`}
            onClick={() => keyPressed(keyboard_key)}
          >
            {keyboard_key}
          </button>
        ))}
      </div>

      <div className="mt-2 flex justify-center gap-[6px]">
        {keyboard_keys.slice(19).map((keyboard_key, idx) => (
          <button
            key={idx + 19}
            ref={(el) => (keyboardKeysRefs.current[idx + 19] = el)}
            onClick={() => keyPressed(keyboard_key)}
            className={`rounded-md border font-bold text-zinc-200 focus:outline-none sm:rounded-lg ${getKeyClasses(
              keyboard_key,
            )} ${
              idx === 0 || idx === 8
                ? "h-[44px] w-[14vw] max-w-[64px] min-w-[44px] px-1 text-[10px] sm:h-[52px] sm:w-[64px] sm:max-w-[64px] sm:text-xs"
                : "h-[44px] w-[8.4vw] max-w-[42px] min-w-[28px] px-0 py-0 text-sm sm:h-[52px] sm:w-[40px] sm:max-w-[40px] sm:text-base"
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
