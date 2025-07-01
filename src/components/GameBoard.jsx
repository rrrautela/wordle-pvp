

function GameBoard({
  boxesRefs                      // Ref to store all box DOM nodes for direct manipulation
}) {
  
  // Initialize an array of 30 undefined elements (6 rows * 5 letters per row)
  const boxes = Array.from({ length: 30 });

  return (
    <div className="h-90 w-77 flex flex-wrap justify-evenly mt-5 ">
      {boxes.map((_, idx) => (
        <div
          key={idx}
          ref={(el) => (boxesRefs.current[idx] = el)} // Save reference to each box div
          className="h-13 w-13 border-2 border-neutral-700" // Box style using TailwindCSS
        ></div>
      ))}
    </div>
  );
}

export default GameBoard;
