import { Universe, Cell } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";
import Fps from "./fps"

const CELL_SIZE = 5;
const GRID_COLOR= "#CCCCCC";
const DEAD_COLOR= "#FFFFFF";
const ALIVE_COLOR="#000000";

let universe = Universe.random();
const width = universe.width();
const height = universe.height();

const canvas = document.getElementById("game-of-life-canvas");
const rangeInput = document.getElementById("toggle-range");
const randomButton = document.getElementById("random");
const clearButton = document.getElementById("clear");
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE +1) * width + 1;
let animationId = null;
let tickPerFrame = 9;

const ctx = canvas.getContext('2d');

const drawGrid = () => {
  ctx.beginPath();
  ctx.strokeStyle = GRID_COLOR;

  // Vertical lines.
  for (let i = 0; i <= width; i++) {
    ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
    ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
  }

  // Horizontal lines.
  for (let j = 0; j <= height; j++) {
    ctx.moveTo(0,                           j * (CELL_SIZE + 1) + 1);
    ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
  }

  ctx.stroke();
};

const getIndex = (row, column) => {
  return row * width + column;
};

const drawCells = () => {
  const cellsPtr = universe.cells();
  // console.log({cellsPtr});
  const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

  ctx.beginPath();

  ctx.fillStyle = ALIVE_COLOR;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = getIndex(row, col);
      if (cells[idx] !== Cell.Alive) {
        continue;
      }

      ctx.fillRect(
        col * (CELL_SIZE + 1) + 1,
        row * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }

  // Dead cells.
  ctx.fillStyle = DEAD_COLOR;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = getIndex(row, col);
      if (cells[idx] !== Cell.Dead) {
        continue;
      }

      ctx.fillRect(
        col * (CELL_SIZE + 1) + 1,
        row * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }

  ctx.stroke();
};
const isPaused = () => !animationId
const playPauseButton = document.getElementById("play-pause");

const play = () => {
  playPauseButton.textContent = "⏸";
  renderLoop();
};

const pause = () => {
  playPauseButton.textContent = "▶";
  cancelAnimationFrame(animationId);
  animationId = null;
};

playPauseButton.addEventListener("click", event => {
  if (isPaused()) {
    play();
  } else {
    pause();
  }
});
const glider = [
  [0, 0],
  [0, 2],
  [1, 1],
  [1, 2],
  [2, 1],
]
const pulsar = [
  [-1, -2],
  [-1, -3],
  [-1, -4],
  [-2, -6],
  [-3, -6],
  [-4, -6],
].reduce((acc, [x,y]) => {
  acc.push([x,y])
  acc.push([-x,y])
  acc.push([x,-y])
  acc.push([-x,-y])
  acc.push([y,x])
  acc.push([-y,x])
  acc.push([y,-x])
  acc.push([-y,-x])
  return acc;
}, [])

canvas.addEventListener("click", event => {
  const { metaKey, shiftKey } = event
  const boundingRect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / boundingRect.width;
  const scaleY = canvas.height / boundingRect.height;

  const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const canvasTop = (event.clientY - boundingRect.top) * scaleY;

  const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
  const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

  if (metaKey) {
    glider.forEach(([r, c]) => universe.toggle_cell(row + r, col + c))
  } else if(shiftKey) {
    pulsar.forEach(([r, c]) => universe.toggle_cell(row + r, col + c))
  } else {
    universe.toggle_cell(row, col);
  }

  drawGrid();
  drawCells();
  return true
});
rangeInput.addEventListener("change", event => {
  const { value } = event.target
  console.log("Tick per animation ", value)
  tickPerFrame = value
})
randomButton.addEventListener("click", () => {
  universe = Universe.random()
  drawGrid();
  drawCells();
})
clearButton.addEventListener("click", (event) => {
  universe = Universe.new()
  drawGrid();
  drawCells();
})

const fps = new Fps(document.getElementById("fps"))
const renderLoop = () => {
  fps.render()
  for (let i=1; i <= tickPerFrame; i++)
    universe.tick();
  drawGrid();
  drawCells();

  animationId = requestAnimationFrame(renderLoop);
}
play()
