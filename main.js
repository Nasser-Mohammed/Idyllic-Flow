




let canvas;
let ctx;
const dt = 0.01;
let time = 0;
let width;
let height;
let isRunning = true;
let startBtn;
let resetBtn;
let cx;
let cy;

// Number of physics updates per render frame
const updateSteps = 1;

// =======================
// Dye field
// =======================
const dyeW = 240;
const dyeH = 180;

let dye;
let dyeNext;
let dyeBlobs = [];
const MAX_BLOBS = 40;


let velocityField = "swirl";

// =======================
// Sprite assets
// =======================
const sprites = {};
const spritePaths = {
  duck:   "images/duck.png",
  turtle: "images/turtle.png",
  leaf:   "images/leaf.png",
  goose:  "images/goose.png"
};

// =======================
// Agents
// =======================
let floaters = [];



function resize() {
    const viewport = document.querySelector('.viewport');
    if (!viewport) return;
    // Set internal resolution to match display size
    canvas.width = viewport.clientWidth;
    canvas.height = viewport.clientHeight;
    width = canvas.width;
    height = canvas.height;
    console.log("Resized width: ", width);
    console.log("Resized height: ", height);
    
    // Recalculate center points immediately after resize
    cx = canvas.width / 2;
    cy = canvas.height / 2;


}


function loadSprites(callback) {
  let loaded = 0;
  const keys = Object.keys(spritePaths);

  keys.forEach(key => {
    const img = new Image();
    img.src = spritePaths[key];
    img.onload = () => {
      loaded++;
      if (loaded === keys.length) {
        callback();
      }
    };
    sprites[key] = img;
  });
}




class Floater {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.img = sprites[type];

    const baseSizes = {
      duck:   140,
      goose:  160,
      turtle: 190,
      leaf:   120
    };

    this.size = baseSizes[type] + Math.random() * 10;

    // --- velocity state (THIS WAS MISSING) ---
    this.vx = 0;
    this.vy = 0;

    // bobbing
    this.phase = Math.random() * Math.PI * 2;
    this.phaseSpeed = 0.8 + Math.random() * 0.4;
  }

  update(dt) {

    const v = velocity(this.x, this.y, time);

    // --- velocity smoothing ---
    const alpha = 0.08; // smaller = heavier object

    this.vx += alpha * (v.u - this.vx);
    this.vy += alpha * (v.v - this.vy);

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // periodic wrapping
    this.x = (this.x + width) % width;
    this.y = (this.y + height) % height;

    this.phase += this.phaseSpeed * dt;
  }

  draw(ctx) {
    const bob = 3 * Math.sin(this.phase + 0.01 * this.x);

    ctx.save();
    ctx.translate(this.x, this.y + bob);
    //ctx.imageSmoothingEnabled = false;

    ctx.drawImage(
      this.img,
      -this.size / 2,
      -this.size / 2,
      this.size,
      this.size
    );

    ctx.restore();
  }
}


function velocity(x, y, t) {
  const scale = 0.002;   // spatial scale
  const speed = 0;     // overall flow strength

  if (velocityField === "cellular") {
    return {
      u: speed * Math.sin(scale * y),
      v: speed * Math.sin(scale * x)
    };
  }

  if (velocityField === "meandering") {
    return {
      u: speed,
      v: speed * 0.6 * Math.sin(scale * x + 0.3 * Math.sin(0.2 * t))
    };
  }

  if (velocityField === "shear") {
    return {
      u: speed * Math.sin(scale * y) * Math.sin(0.3 * t),
      v: 0
    };
  }
   if (velocityField === "swirl") {
        const cx = width / 2;
        const cy = height / 2;
        const dx = x - cx;
        const dy = y - cy;
        return {
            u: -dy * 0.02,
            v:  dx * 0.02
        };
        }


  return { u: 0, v: 0 };
}

function render() {

  // Water background
  ctx.fillStyle = "rgb(195, 221, 255)";
  ctx.fillRect(0, 0, width, height);

  if (isRunning) {
    for (const f of floaters) f.update(dt);
    time += dt;
  }


  // Then ducks on top
  for (const f of floaters) f.draw(ctx);




  requestAnimationFrame(render);
}






function globalReset(startBtn){
    isRunning = false; // pauses motion
    startBtn.innerText = "Initiate System";
    startBtn.style.backgroundColor = "#15ff00"; 
}



document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('simCanvas');
    ctx = canvas.getContext('2d');
    startBtn = document.getElementById('start-simulation');
    resetBtn = document.getElementById('reset-global');
    
    window.addEventListener('resize', resize);
    resize();

    canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const types = ["duck", "turtle", "leaf", "goose"];
    const type = types[Math.floor(Math.random() * types.length)];

    floaters.push(new Floater(x, y, type));
    });

    const flowSelect = document.getElementById("flow-select");
    flowSelect.addEventListener("change", e => {
    velocityField = e.target.value;
    });



    startBtn.addEventListener('click', () => {
        // Toggle the boolean
        isRunning = !isRunning;
        if (isRunning) {
            startBtn.innerText = "Pause System";
            startBtn.style.backgroundColor = "#fffb1f"; 
        } else {
            startBtn.innerText = "Initiate System";
            startBtn.style.backgroundColor = "#15ff00"; 
        }
    });

    resetBtn.addEventListener("click", () => {
        globalReset(startBtn);
    });

    const panel = document.getElementById("control-panel");
    const togglePanelBtn = document.getElementById("toggle-panel");

    togglePanelBtn.addEventListener("click", () => {
    panel.classList.toggle("closed");
    togglePanelBtn.textContent = panel.classList.contains("closed") ? "▼" : "▲";
    });




    loadSprites(() => {
        render();
        });



});