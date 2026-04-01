// Keyboard component
// Responsible for rendering on-screen Wordle-style keyboard
// Props:
// keyPressed         -> function called whenever a key is clicked
// keyboardKeysRefs  -> useRef([]) array storing DOM references of every key button
// keyboard_keys     -> array like ['Q','W','E',...,'Z','Enter','Backspace']

function KeyBoard({ keyPressed, keyboardKeysRefs, keyboard_keys }) {

  // Make sure the ref array always matches keyboard size.
  // This prevents undefined indexes later when we try to access buttons directly.
  // Example: keyboardKeysRefs.current[5].style.backgroundColor = "green"
  if (keyboardKeysRefs.current.length !== keyboard_keys.length) {
    keyboardKeysRefs.current = Array(keyboard_keys.length);
  }

  return (
    <div className="h-full w-full max-w-full overflow-x-hidden">

      {/* ================= FIRST ROW (Q → P) ================= */}
      <div className="flex justify-center gap-[4px]">
        {
          // Take first 10 keys and render them
          keyboard_keys.slice(0, 10).map((keyboard_key, idx) => (
            <div key={idx}>

              <button
                // Store actual DOM node of each button at its index
                // This allows parent component to manually color / disable keys
                ref={(el) => (keyboardKeysRefs.current[idx] = el)}

                // Tailwind styles: fixed size, bold text, gray background
                className="h-[52px] w-[40px] text-zinc-200 text-lg font-bold bg-neutral-500 border border-gray-700 rounded focus:outline-none"

                // When clicked, send this key back to parent logic
                onClick={() => keyPressed(keyboard_key)}
              >
                {/* Display letter */}
                {keyboard_key}
              </button>

            </div>
          ))
        }
      </div>

      {/* ================= SECOND ROW (A → L) ================= */}
      <div className="mt-2 flex justify-center gap-[4px]">

        {/* slice(10,19) grabs middle keyboard row */}
        {keyboard_keys.slice(10, 19).map((keyboard_key, idx) => (
          <div key={idx + 10}>

            <button
              // idx starts from 0 again, so we offset by +10
              // This keeps ref index aligned with original keyboard_keys array
              ref={(el) => (keyboardKeysRefs.current[idx + 10] = el)}

              className="h-[52px] w-[40px] text-zinc-200 text-lg font-bold bg-neutral-500 border border-gray-700 rounded focus:outline-none"

              onClick={() => keyPressed(keyboard_key)}
            >
              {keyboard_key}
            </button>

          </div>
        ))}
      </div>

      {/* ================= THIRD ROW (Enter → Backspace) ================= */}
      <div className="mt-2 flex justify-center gap-[4px]">

        {/* Remaining keys: includes Enter + letters + Backspace */}
        {keyboard_keys.slice(19).map((keyboard_key, idx) => (
          <div key={idx + 19}>

            <button
              // Again offset index to match original keyboard array
              ref={(el) => (keyboardKeysRefs.current[idx + 19] = el)}

              onClick={() => keyPressed(keyboard_key)}

              className={
                // First and last buttons are Enter + Backspace
                // They are wider than normal letters
                idx === 8
                  ? "h-[52px] w-[64px] text-zinc-200 text-sm font-bold bg-neutral-500 border border-gray-700 rounded focus:outline-none"
                  : "h-[52px] w-[40px] text-zinc-200 text-lg font-bold bg-neutral-500 border border-gray-700 rounded focus:outline-none"
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
