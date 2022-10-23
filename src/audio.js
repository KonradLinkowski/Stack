import * as THREE from "three";
import songUrl from "./sounds/bg1.mp3";
import songUrl1 from "./sounds/tile.mp3";

//adding background sound
 export const addAudioListenerToCamera = (camera) => {
  camera.add(createAudioListener());
}; 

export const createAudioListener = () => {
  const listener = new THREE.AudioListener();

  const audioLoader = new THREE.AudioLoader();

  const sound = new THREE.Audio(listener);

  audioLoader.load(songUrl, (buffer) => {
    console.log("background music started");
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.3);
    sound.play();
  });

  return listener;
};

  // addAudioListenerToCamera1 = normal-effect tile
  export const addAudioListenerToCamera1 = () => {
    const audio = new Audio(songUrl1);
    audio.play();
  }
  
//   //addAudioListenerToCamera2 = perfect-effect tile
//   export const addAudioListenerToCamera2 = () => {
//     var audio = new Audio(songUrl1);
//     audio.play();
//   } 
