function GameBoard(props) {
  // Extract the ref object from props
  const gameBoardBoxesRefs = props.gameBoardBoxesRefs;

  // Create an array of length 30
  // Each element is `undefined`, we only care about the index
  const boxes = Array.from({ length: 30 });

  // This function will be called for EACH box by React
  // React passes the DOM element automatically as `element`
  function saveBoxRef(index, element) {
    // Store the DOM node at the correct index
    gameBoardBoxesRefs.current[index] = element;
  }

  // This function renders ONE box
  // map() will call this 30 times
  function renderSingleBox(_, index) {
    return (
      <div
        key={index}
        // Callback ref: React calls this function with the real DOM node
        // when the div is mounted; we store it at the same index for later use
        ref={function (element) {
          saveBoxRef(index, element);
        }}
        className="h-13 w-13 mt-2 border-2 border-neutral-700"
      ></div>
    );
  }

  return (
    <div className="h-90 w-77 flex flex-wrap justify-evenly mt-5">
      {boxes.map(renderSingleBox)}
    </div>
  );
}

export default GameBoard;
