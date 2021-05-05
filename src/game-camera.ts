import { BoxGeometry, Clock, Color, Mesh, MeshPhongMaterial, OrthographicCamera, PerspectiveCamera, Scene, Vector2, Vector3 } from 'three';

export class GameCamera {
  camera: PerspectiveCamera
  point: Vector3
  start: Vector3
  destination: Vector3
  offset = new Vector3(
    -250,
    250,
    -250,
  )
  timer: number;
  animationTime = 0.5

  constructor() {
    this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    this.camera.position.set(
      this.offset.x,
      this.offset.y,
      this.offset.z
    )
    this.camera.lookAt(0, 50, 0)
  }

  update(delta: number) {
    const ease = t => t * t * (3.0 - 2.0 * t)
      if (this.timer < this.animationTime) {
        const change = ease(this.timer / this.animationTime)
        this.camera.position.lerpVectors(this.start, this.destination, change)
        this.timer += delta
      }
  }

  setWatchPoint(point: Vector3) {
    this.point = point
    this.timer = 0
    this.start = this.camera.position.clone()
    this.destination = point.clone().add(this.offset)
  }

  resize(ratio: number) {
    this.camera.aspect = ratio;
    this.camera.updateProjectionMatrix();
  }
}
