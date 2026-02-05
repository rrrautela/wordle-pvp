import { useRef, useEffect } from "react";

function Sample5BoxesComponent({ boxesRef, sampleWord }) {
  const letters = sampleWord.split("");
  return (
    <div className="flex flex-wrap">
      {letters.map((letter, idx) => (
        <div
          key={letter + idx}
          ref={(el) => (boxesRef.current[`${letter}${idx}`] = el)}
          className="h-[25px] w-[25px] m-0.5 flex items-center justify-center border-2 border-neutral-700 text-2xl"

          >
          <b className="text-sm">{letter}</b>
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
        if(onClose) onClose();
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
    <div ref = {wrapperRef} className="fixed top-1/2 left-1/2 z-50 transform -translate-x-1/2 -translate-y-1/2 w-9/10 h-[65vh] sm:w-[60vh] sm:h-[77vh] p-4 bg-black text-white shadow-xl rounded-lg overflow-auto">
      <div className="flex justify-between">
        <h1 className="text-lg font-bold pb-4">How To Play?</h1>
        <button className = " text-2xl font-bold pb-4" onClick={onClose}>X</button>
      </div>
      <p className="text-sm">Guess the Word in 6 tries.</p>
      <ol className="list-decimal pl-6 pb-4">
        <li>Each guess must be a valid 5 letter word.</li>
        <li>The color of the tiles will change to show how close your guess was to the word.</li>
      </ol>

      <b>Examples</b>
      <hr className="my-2" />

      {/* correct letter guess example */}
      <Sample5BoxesComponent boxesRef={boxesRef} sampleWord="WORDY" />
      <p className="text-sm"><b>W</b> is in the word and in the correct spot.</p>
      <br />

      {/* partially correct letter guess example */}
      <Sample5BoxesComponent boxesRef={boxesRef} sampleWord="LIGHT" />
      <p className="text-sm"><b>I</b> is in the word but in the wrong spot.</p>
      <br />

      {/* completely incorrect letter guess example */}
      <Sample5BoxesComponent boxesRef={boxesRef} sampleWord="ROGUE" />
      <p className="text-sm"><b>U</b> is not in the word, in any spot.</p>
      <br />

      <hr className="my-2" />
      <p className="text-sm"> Unlimited Wordle games all day long.</p>
    </div>
  );
}
