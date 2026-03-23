// import { useEffect, useState } from "react";

export default function MultiPlayer() {
  let socketController = 7;
  // const socketController = {
  //   submitGuess(word){
  //     socket.emit("guess", word);
  //   }
  // }
  return <GameWindow gameController={socketController} />
  


  
}

