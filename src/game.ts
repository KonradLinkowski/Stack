import {
  AmbientLight,
  Box3,
  BoxGeometry,
  Clock,
  Color,
  DirectionalLight,
  Mesh,
  MeshPhongMaterial,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { GameCamera } from "./game-camera";
import { MovingTile } from "./moving-tile";
import { PerfectEffect } from "./perfect-effect";
import { Tile } from "./tile";

import { Stats } from "./stats";

export class Game {
  cubes: Tile[] = [];
  effects: PerfectEffect[] = [];
  $points: HTMLElement;
  scene: Scene;
  camera: GameCamera;
  renderer: WebGLRenderer;
  movingTile: MovingTile;
  previousTile: Box3;
  clock: Clock;
  index: number = 0;
  stats: Stats;
  debug = false;

  constructor() {
    const urlParams = new URLSearchParams(window.location.search);
    this.debug = Boolean(urlParams.get('debug'));
    if (this.debug) {
      this.stats = new Stats()
      document.body.appendChild(this.stats.container)
    }
    this.clock = new Clock();
    this.$points = document.querySelector("#points");

    window.addEventListener("resize", this.onWindowResize.bind(this));

    
    this.initScene();
    this.reset();
    
    this.moveUp();
    this.renderer.domElement.addEventListener("click", this.onClick.bind(this));

    this.animate();
  }

  onClick() {
    this.cutBox();
    this.moveUp();
  }

  onWindowResize() {
    this.camera.resize(window.innerWidth / window.innerHeight);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    this.render();
  }

  render() {
    const delta = this.clock.getDelta();

    this.movingTile.update(delta);

    this.effects.forEach((effect) => effect.update(delta));

    this.camera.update(delta);

    this.renderer.render(this.scene, this.camera.camera);

    if (this.debug) [
      this.stats.update()
    ]
  }

  moveUp() {
    this.index += 1;
    const size = new Vector3();
    this.previousTile.getSize(size);
    const center = new Vector3();
    this.previousTile.getCenter(center);

    this.movingTile.resize(
      new Vector2(center.x, center.z),
      new Vector2(size.x, size.z)
    );
    this.movingTile.setIndex(this.index);

    this.camera.setWatchPoint(new Vector3(0, center.y, 0));
  }

  cutBox() {
    // calculate previous and current tiles centers
    const currentTile = new Box3().setFromObject(this.movingTile.mesh);
    const currentCenter = new Vector3();
    currentTile.getCenter(currentCenter);
    const previousCenter = new Vector3();
    this.previousTile.getCenter(previousCenter);

    // get vectors difference
    const diff = currentCenter.sub(previousCenter);
    const previousSize = new Vector3();
    this.previousTile.getSize(previousSize);

    // calculate absolute error
    const errorX = Math.abs(diff.x) / previousSize.x;
    const errorZ = Math.abs(diff.z) / previousSize.z;

    // if error is less than arbitrary epsilon than don't cut the tile at all
    const eps = 0.05;
    if (errorX <= eps && errorZ <= eps) {
      diff.x = 0;
      diff.z = 0;

      this.spawnEffect(previousCenter, new Vector2(previousSize.x, previousSize.z));
    }
    
    previousSize.x -= Math.abs(diff.x);
    previousSize.z -= Math.abs(diff.z);

    if (previousSize.x < 0 || previousSize.z < 0) {
      this.reset();
      return;
    }

    const cutTile = new Tile(
      new Vector2(previousCenter.x + diff.x / 2, previousCenter.z + diff.z / 2),
      new Vector2(previousSize.x, previousSize.z),
      this.index
    );
    this.scene.add(cutTile.mesh);

    this.cubes.push(cutTile);

    this.previousTile = new Box3().setFromObject(cutTile.mesh);

    // update score
    this.$points.textContent = this.index.toString();
  }

  spawnEffect(position, size) {
    const plane = new PerfectEffect(position, size, () => {
      this.effects.splice(this.effects.indexOf(plane, 1));
      this.scene.remove(plane.mesh);
    });
    this.scene.add(plane.mesh);
    this.effects.push(plane);
  }

  reset() {
    this.camera.setWatchPoint(new Vector3(0, 0, 0));
    this.index = 0;

    this.movingTile.resize(new Vector2(0, 0), new Vector2(100, 100));
    this.movingTile.setIndex(0);

    this.cubes.forEach((c) => this.scene.remove(c.mesh));
    this.cubes.length = 0;
    this.previousTile = new Box3(new Vector3(-50, -10, -50), new Vector3(50, 0, 50));
    this.$points.textContent = (0).toString();
  }

  initScene() {
    this.camera = new GameCamera();
    this.scene = new Scene();

    const ambientLight = new AmbientLight(0xcccccc, 0.4);
    this.scene.add(ambientLight);

    const dirLight = new DirectionalLight(0xffffff, 1);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(-1, 1.75, -0.5);
    dirLight.position.multiplyScalar(30);

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    const d = 50;

    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;

    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.bias = -0.0001;

    this.scene.add(dirLight);

    const material = new MeshPhongMaterial({
      color: new Color(`hsl(${this.index * 5}, 50%, 50%)`),
    });

    const base = new Mesh(new BoxGeometry(100, 500, 100), material);
    base.position.y = -245;
    this.scene.add(base);

    this.movingTile = new MovingTile(new Vector2(100, 100));

    this.scene.add(this.movingTile.mesh);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
  }
}
