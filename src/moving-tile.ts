import { BoxGeometry, Mesh, MeshPhongMaterial, Vector2, Vector3 } from 'three';

export class MovingTile {
  mesh: Mesh;
  private height = 10;
  private startOffset = 100;
  private direction = -1;
  private index = 0

  constructor(size: Vector2) {
    const material = new MeshPhongMaterial();
    material.color.setHSL(this.index * 5, 0.5, 0.5);
    const geometry = new BoxGeometry(size.x, this.height, size.y);
    this.mesh = new Mesh(geometry, material);
  }

  resize(position: Vector3, size: Vector2) {
    this.mesh.geometry.dispose()
    const geometry = new BoxGeometry(size.x, this.height, size.y);
    this.mesh.geometry = geometry
    this.mesh.position.x = position.x
    this.mesh.position.z = position.z
  }

  setIndex(index: number) {
    this.index = index;
    (this.mesh.material as MeshPhongMaterial).color.setHSL(this.index * 5 / 360, 0.5, 0.5);
    this.mesh.position.y = this.index * this.height
    const even = this.index % 2 == 0
    this.mesh.position.set(
      even ? this.startOffset : this.mesh.position.x,
      this.index * this.height,
      !even ? this.startOffset : this.mesh.position.z
    );
  }

  update(delta: number) {  
    const axis = this.index % 2 == 0 ? 'x' : 'z'
    this.mesh.position[axis] += delta * 150 * this.direction
  
    if (Math.abs(this.mesh.position[axis]) >= 100) {
      this.direction = -this.direction
      this.mesh.position.clamp(
        new Vector3(-100, Number.NEGATIVE_INFINITY, -100),
        new Vector3(100, Number.POSITIVE_INFINITY, 100)
      )
    }
  }
}
