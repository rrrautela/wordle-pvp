import { useRef, useEffect } from "react";

function Sample5BoxesComponent({ boxesRef, sampleWord }) {
  const letters = sampleWord.split("");
  return (
    <div className="flex flex-wrap">
      {letters.map((letter, idx) => (
        <div
          key={letter + idx}
          ref={(el) => (boxesRef.current[`${letter}${idx}`] = el)}
          className="h-[40px] w-[40px] m-0.5 flex items-center justify-center border-2 border-neutral-700 text-2xl"

          >
          <b>{letter}</b>
        </div>
      ))}
    </div>
  );
}

function colorFlipAnimation(box, color, delay = 0) {
  if (!box) return;
  // half-flip
  setTimeout(() => {
    box.style.transition = "transform 0.6s";
    box.style.transform = "rotateX(90deg)";
  }, delay);
  // color + flip back
  setTimeout(() => {
    box.classList.remove("border-2", "border-neutral-700");
    box.classList.add(color);
    box.style.transform = "rotateX(0deg)";
  }, delay + 300);

  // cleanup
  setTimeout(() => {
    box.style.transition = "";
    box.style.transform = "";
  }, delay + 600);
}

export default function IntroductionWindow({onClose}) {
  const boxesRef = useRef({});
  const wrapperRef = useRef(null);

  // Dismiss on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    
  }, [onClose]);


  useEffect(() => {
    // wait a tick so refs have mounted
    setTimeout(() => {
      // WORDY example: highlight W at index 0
      colorFlipAnimation(boxesRef.current["W0"], "bg-green-800", 0);
      // LIGHT example: highlight I at index 1
      colorFlipAnimation(boxesRef.current["I1"], "bg-yellow-600", 300);
      // ROGUE example: highlight U at index 3
      colorFlipAnimation(boxesRef.current["U3"], "bg-zinc-700", 600);
    }, 50);
  }, []);

  return (
    <div ref = {wrapperRef} className="fixed top-1/2 left-1/2 z-50 transform -translate-x-1/2 -translate-y-1/2 w-[510px] h-[95vh] p-4 bg-black text-white shadow-xl rounded-lg overflow-auto">

      <h1 className="text-3xl font-bold pb-4">How To Play?</h1>
      Guess the Wordle in 6 tries.
      <ol className="list-decimal pl-6 pb-4">
        <li>Each guess must be a valid 5 letter word.</li>
        <li>The color of the tiles will change to show how close your guess was to the word.</li>
      </ol>

      <b>Examples</b>
      <hr className="my-2" />

      {/* correct letter guess example */}
      <Sample5BoxesComponent boxesRef={boxesRef} sampleWord="WORDY" />
      <p><b>W</b> is in the word and in the correct spot.</p>
      <br />

      {/* partially correct letter guess example */}
      <Sample5BoxesComponent boxesRef={boxesRef} sampleWord="LIGHT" />
      <p><b>I</b> is in the word but in the wrong spot.</p>
      <br />

      {/* completely incorrect letter guess example */}
      <Sample5BoxesComponent boxesRef={boxesRef} sampleWord="ROGUE" />
      <p><b>U</b> is not in the word, in any spot.</p>
      <br />

      <hr className="my-2" />
      Unlimited Wordle games all day long.
    </div>
  );
}
