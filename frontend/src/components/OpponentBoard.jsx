export default function OpponentBoard({ opponentRows, opponentBoardBoxesRefs }) {
  const boxes = Array.from({ length: 30 });

  function saveBoxRef(index, element) {
    opponentBoardBoxesRefs.current[index] = element;
  }

  function renderSingleBox(_, index) {
    const rowIndex = Math.floor(index / 5);
    const colIndex = index % 5;
    const color = opponentRows?.[rowIndex]?.[colIndex] || "";

    return (
      <div
        key={index}
        ref={(element) => saveBoxRef(index, element)}
        className={`h-13 w-13 mt-2 border-2 border-neutral-700 ${color || ""}`}
      ></div>
    );
  }

  return (
    <div className="h-90 w-77 flex flex-wrap justify-evenly mt-5 opacity-80">
      {boxes.map(renderSingleBox)}
    </div>
  );
}
