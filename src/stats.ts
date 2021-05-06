// borrowed from https://github.com/mrdoob/three.js/blob/dev/examples/jsm/libs/stats.module.js

const PR = Math.round(window.devicePixelRatio || 1);

const WIDTH = 80 * PR;
const HEIGHT = 48 * PR;
const TEXT_X = 3 * PR;
const TEXT_Y = 2 * PR;
const GRAPH_X = 3 * PR;
const GRAPH_Y = 15 * PR;
const GRAPH_WIDTH = 74 * PR;
const GRAPH_HEIGHT = 30 * PR;

interface UpdateData {
	beginTime: number;
	currentTime: number;
	previousTime: number;
	frames: number;
	memory: {
		usedJSHeapSize: number;
		jsHeapSizeLimit: number;
	}
}

class Panel {
	container: HTMLElement
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private min = Number.POSITIVE_INFINITY;
  private max = 0;

  constructor(
		private name: string,
		private fgColor: string,
		private bgColor: string,
		private updateFn: (data: UpdateData) => { value: number, maxValue: number }
	) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.canvas.style.cssText = "width:80px;height:48px";

		this.container = this.canvas

    this.context = this.canvas.getContext("2d");
    this.context.font = "bold " + 9 * PR + "px Helvetica,Arial,sans-serif";
    this.context.textBaseline = "top";

    this.context.fillStyle = bgColor;
    this.context.fillRect(0, 0, WIDTH, HEIGHT);

    this.context.fillStyle = fgColor;
    this.context.fillText(name, TEXT_X, TEXT_Y);
    this.context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

    this.context.fillStyle = bgColor;
    this.context.globalAlpha = 0.9;
    this.context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
  }

	update(data: UpdateData) {
		const result = this.updateFn(data)
		if (result) {
			this.selfUpdate(result.value, result.maxValue)
		}
	}

  private selfUpdate(value: number, maxValue: number) {
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);

    this.context.fillStyle = this.bgColor;
    this.context.globalAlpha = 1;
    this.context.fillRect(0, 0, WIDTH, GRAPH_Y);
    this.context.fillStyle = this.fgColor;
    this.context.fillText(
      `${Math.round(value)} ${this.name} (${Math.round(this.min)} ${Math.round(this.max)})`,
      TEXT_X,
      TEXT_Y
    );
    this.context.drawImage(
      this.canvas,
      GRAPH_X + PR,
      GRAPH_Y,
      GRAPH_WIDTH - PR,
      GRAPH_HEIGHT,
      GRAPH_X,
      GRAPH_Y,
      GRAPH_WIDTH - PR,
      GRAPH_HEIGHT
    );

    this.context.fillRect(
      GRAPH_X + GRAPH_WIDTH - PR,
      GRAPH_Y,
      PR,
      GRAPH_HEIGHT
    );

    this.context.fillStyle = this.bgColor;
    this.context.globalAlpha = 0.9;
    this.context.fillRect(
      GRAPH_X + GRAPH_WIDTH - PR,
      GRAPH_Y,
      PR,
      Math.round((1 - value / maxValue) * GRAPH_HEIGHT)
    );
  }
}

export class Stats {
  container: HTMLElement;
  private mode: number;
  private frames: number = 0;
	private performance: (Performance | DateConstructor) & { memory?: any } = performance || Date
  private beginTime: number = this.performance.now();
  private prevTime: number = this.beginTime;
	private panels: Panel[] = [];

  constructor() {
    this.mode = 0;

    this.container = document.createElement("div");
    this.container.style.cssText =
      "position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000";
    this.container.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        this.showPanel(++this.mode % this.container.children.length);
      },
      false
    );

    this.addPanel(new Panel("FPS", "#0ff", "#002", ({ currentTime, frames, previousTime }) => {
			if (currentTime >= this.prevTime + 1000) {
				return {
					value: frames * 1000 / (currentTime - previousTime),
					maxValue: 100
				}
			}
		}));
    this.addPanel(new Panel("MS", "#0f0", "#020", ({ currentTime, beginTime }) => {
			return {
				value: currentTime - beginTime,
				maxValue: 200
			}
		}));

    if ('memory' in this.performance) {
      this.addPanel(new Panel("MB", "#f08", "#201", ({ memory }) => {
				return {
					value: memory.usedJSHeapSize / 1048576,
          maxValue: memory.jsHeapSizeLimit / 1048576
				}
			}));
    }

    this.showPanel(0);
  }

  begin() {
    this.beginTime = this.performance.now();
  }

  end() {
    this.frames++;

    const time = this.performance.now();

		this.panels.forEach(p => p.update({
			beginTime: this.beginTime,
			previousTime: this.prevTime,
			currentTime: time,
			memory: this.performance.memory,
			frames: this.frames
		}))

    if (time >= this.prevTime + 1000) {
      this.prevTime = time;
      this.frames = 0;
    }

    return time;
  }

  update() {
    this.beginTime = this.end();
  }

  private addPanel(panel: Panel) {
		this.panels.push(panel)
    this.container.appendChild(panel.container);
    return panel;
  }

  private showPanel(id: number) {
		this.panels.forEach((panel, i) => {
      panel.container.style.display = i === id ? "block" : "none";
		});

    this.mode = id;
  }
}
