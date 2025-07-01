

function Sample5BoxesComponent({sampleWord, sampleColor, coloredLetter}) {
  // dummy number is different eveyrtime this component is used, to avoid same key in boxes
  
  // our word string converted to array
  const sampleWordLetters = sampleWord.split("");
  return <div className="flex flex-wrap ">
      {sampleWordLetters.map((letter, idx) => (
        <div
          key = {letter + idx}
          style={sampleWordLetters[idx] === coloredLetter ? { backgroundColor: sampleColor } : {}}
          className={`h-[5vw] w-[5vw] flex items-center justify-center border-2 border-neutral-700 ${
                      letter === coloredLetter ? sampleColor : ''
                    }`}
          
        ><b>{letter}</b></div>
      ))}
  </div>    
  }

export default function IntroductionWindow(){
  // do somethign like 
  // showdiv && IntroductionWindow
  // in the app Component

  return <div className = "mt-[5vh] h-[95vh] w-fit mx-auto shadow z-50 bg-black text-white  text-md">

    <h1 className = "text-3xl font-bold pt-4">How To Play</h1>
    Guess the Wordle in 6 tries.
    <ol>
      <li>Each guess must be a valid 5 letter word.</li>
      <li>The color of the tiles will change to show how close your guess was to the word.</li>
    </ol>

    <b>Examples</b>
    <hr/>

    {/* correct letter guess example*/}
    <Sample5BoxesComponent
      coloredLetter = {"W"}
      sampleWord = {"WORDY"}
      sampleColor = {"bg-green-800"}
    />
    <b>W</b> is in the word and in the correct spot.

    {/* partially correct letter guess example */}
    <br />
    <Sample5BoxesComponent
      coloredLetter = {"I"}
      sampleWord = {"LIGHT"}
      sampleColor = {"bg-yellow-600"}
    />
    <b>O</b> is in the word but in the wrong spot.

    {/* compltely incorrect letter guess example */}
    <br />
    <Sample5BoxesComponent
      coloredLetter = {"U"}
      sampleWord = {"ROGUE"}
      sampleColor = {"bg-zinc-700"}
    />
     <b>C</b> is not in the word, in any spot
    <br />
    <hr />
    Unlimited wordle games all day long.

  </div>
}