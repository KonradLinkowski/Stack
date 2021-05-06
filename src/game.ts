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
import { FadingTile } from './fading-tile';

import { Stats } from "./stats";

export class Game {
  cubes: Tile[] = [];
  effects: PerfectEffect[] = [];
  $points: HTMLElement;
  scene: Scene;
  camera: GameCamera;
  renderer: WebGLRenderer;
  movingTile: MovingTile;
  previousTile: {
    size: Vector2;
    center: Vector3;
  };
  clock: Clock;
  index: number = 0;
  stats: Stats;
  debug = false;
  clicked = false;

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
    if (this.clicked) return
    this.clicked = true
    this.cutBox();
    this.moveUp();
    this.clicked = false
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

    this.cubes.forEach((c) => {
      if (c instanceof FadingTile) {
        c.update(delta);
      }
    });

    this.camera.update(delta);

    this.renderer.render(this.scene, this.camera.camera);

    if (this.debug) [
      this.stats.update()
    ]
  }

  moveUp() {
    this.index += 1;
    this.movingTile.resize(
      this.previousTile.center,
      this.previousTile.size
    );
    this.movingTile.setIndex(this.index);

    this.camera.setWatchPoint(new Vector3(0, this.previousTile.center.y, 0));
  }

  cutBox() {
    // calculate previous and current tiles centers
    const currentTile = new Box3().setFromObject(this.movingTile.mesh);
    const currentCenter = new Vector3();
    this.movingTile.mesh.localToWorld(currentCenter)
    currentTile.getCenter(currentCenter);

    // get vectors difference
    const diff = currentCenter.clone().sub(this.previousTile.center);

    const absDiffX = Math.abs(diff.x)
    const absDiffZ = Math.abs(diff.z)

    const newSize = this.previousTile.size.clone();
    newSize.x -= absDiffX
    newSize.y -= absDiffZ

    if (newSize.x < 0 || newSize.y < 0) {
      this.reset();
      return;
    }

    // calculate absolute error
    const errorX = absDiffX / this.previousTile.size.x;
    const errorZ = absDiffZ / this.previousTile.size.y;

    // if error is less than arbitrary epsilon than don't cut the tile at all
    const eps = 0.05;
    if (errorX <= eps && errorZ <= eps) {
      diff.x = 0;
      diff.z = 0;
      newSize.x += absDiffX
      newSize.y += absDiffZ

      this.spawnEffect(this.previousTile.center, this.previousTile.size);
    } else {
      const cutSizeX = this.previousTile.size.x - newSize.x
      const cutSizeZ = this.previousTile.size.y - newSize.y

      const signX = currentCenter.x - this.previousTile.center.x < 0 ? -1 : 1
      const signZ = currentCenter.z - this.previousTile.center.y < 0 ? -1 : 1

      const position = new Vector3(
        cutSizeX ? currentCenter.x + signX * newSize.x / 2 : this.previousTile.center.x,
        this.previousTile.center.y + 10,
        cutSizeZ ? currentCenter.z + signZ * newSize.y / 2 : this.previousTile.center.z
      )


      const cutTile = new FadingTile(
        position,
        new Vector2(cutSizeX || this.previousTile.size.x, cutSizeZ || this.previousTile.size.y),
        this.index
      );
      this.scene.add(cutTile.mesh);
  
      this.cubes.push(cutTile);
    }

    const newCenter = new Vector3(
      this.previousTile.center.x + diff.x / 2,
      this.previousTile.center.y + 10, 
      this.previousTile.center.z + diff.z / 2
    )

    const newTile = new Tile(newCenter, newSize, this.index);
    this.scene.add(newTile.mesh);

    this.cubes.push(newTile);

    this.previousTile = {
      center: newCenter,
      size: newSize
    };

    // update score
    this.$points.textContent = this.index.toString();
  }

  spawnEffect(position: Vector3, size: Vector2) {
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

    this.movingTile.resize(new Vector3(0, 0, 0), new Vector2(100, 100));
    this.movingTile.setIndex(0);

    this.cubes.forEach((c) => this.scene.remove(c.mesh));
    this.cubes.length = 0;
    this.previousTile = {
      center: new Vector3(0, 0, 0),
      size: new Vector2(100, 100)
    };
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
