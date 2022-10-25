import * as THREE from "three";

export const addAudioListenerToCamera = (camera) => {
  camera.camera.add(createAudioListener());
}; 

const songUrl = require("./sounds/bg1.mp3");
const songUrl1 = require("./sounds/tile.mp3");

export const createAudioListener = () => {
  const listener = new THREE.AudioListener();

  const audioLoader = new THREE.AudioLoader();

  const sound = new THREE.Audio(listener);

  audioLoader.load(songUrl, (buffer) => {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.3);
    sound.play();
  });

  return listener;
};

  export const tile_sound = () => {
    const audio = new Audio(songUrl1);
    audio.play();
  }