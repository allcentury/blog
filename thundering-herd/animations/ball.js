const canvas = document.getElementById("animation");
const ctx = canvas.getContext("2d");
const black = "#000000";

// Steps is the magic variable to change here.
// When we use getPaths() to determine the shortest path
// from the jobs to the service, we trim them down to the amount
// of steps.  With a higher step amount, the objects
// follow their path more closely, which yields more objects
// arriving at Service in pseudo-random order.  When steps is a lower number
// the reverse happens, which shows the thundering herd problem.
//
// We use 25 to show random arrivals and 12 for the thundering herd.
const steps = 12;

const degradeService = function() {
  return steps <= 20
}

const resizeCanvas = function() {
  let cW = window.innerWidth;
  let cH = window.innerHeight;
  canvas.width = cW * devicePixelRatio;
  canvas.height = cH * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
};

function init() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  setInterval(draw, 180)
}

class Color {
  constructor(hue, saturation, lightness) {
    this.hue = hue
    this.saturation = saturation
    this.lightness = lightness
  }

  isRed() {
    this.hue == 0 && this.saturation == 100 && this.lightness == 50
  }

  toCss() {
    return `hsl(${this.hue}, ${this.saturation}%, ${this.lightness}%)`
  }
}

class Box {
  constructor(x, y, h, w, hsl) {
    this.x = x;
    this.y = y;
    this.h = h;
    this.w = w;
    this.hsl = hsl
  }

  draw(ctx) {
    ctx.fillStyle = this.hsl.toCss()
    ctx.fillRect(this.x, this.y, this.w, this.h)
  }

  mid() {
    return [
      (this.x + (this.x + this.w)) / 2,
      (this.y + (this.y + this.h)) / 2,
    ]
  }

  topRight() {
    return [this.x, this.x + this.w]
  }

  topLeft() {
    return [this.x, this.y]
  }

  bottomLeft() {
    return [this.x, this.y + this.h]
  }

  bottomRight() {
    return [this.x + this.w, this.y + this.h]
  }

  degrade() {
    let copy = this.hsl
    if(copy.hue > 0) {
      let adjusted = copy.hue - 6
      copy.hue = Math.max(adjusted, 0)
    }
    if(copy.saturation < 100) {
      copy.saturation += 2
    }
    if(copy.lightness < 50) {
      copy.lightness += 0.5
    }
  }
}

function externalColor() {
  return new Color(147, 50, 47);
}

const externalService = new Box(450, 100, 70, 100, externalColor());
console.log("external: ", externalService)

const jobColor = new Color(300, 76, 72);
const jobs = [
  new Box(10, 10, 30, 30, jobColor),
  new Box(10, 50, 30, 30, jobColor),
  new Box(10, 90, 30, 30, jobColor),
  new Box(10, 130, 30, 30, jobColor),
  new Box(10, 170, 30, 30, jobColor),
  new Box(10, 210, 30, 30, jobColor),
  new Box(10, 250, 30, 30, jobColor),
]


const grid = new PF.Grid(120, 60);
const objectDimension = 5;

// getPath returns a set of coordinates using A*
// we use object dimension to determine the amount of space
// a single object should take up and adjust the paths accordingly
function getPaths(jS, eS) {
  const gridBackup = grid.clone();
  const finder = new PF.AStarFinder();
  const path = finder.findPath(jS.x / objectDimension, jS.y / objectDimension, eS.mid()[0] / objectDimension, eS.mid()[1] / objectDimension, gridBackup);
  return path.map(p => [p[0] * objectDimension, p[1] * objectDimension])
}

class Request {
  constructor(paths, startBox, velocity) {
    this.paths  = paths;
    this.startBox = startBox;
    this.velocity = velocity;
    this.counter = 0;
  }
}

const requests = jobs.map(j => {
  let paths = getPaths(j, externalService)
  let velocity = Math.ceil(paths.length / steps)
  return new Request(
    paths,
    j,
    velocity
  )
})

console.log(requests)

const colors = [
  125,
  205,
  25,
  100,
]

let currentColor = null;
function getColor() {
  if (currentColor == null) {
    currentColor = Math.floor(Math.random() * colors.length)
    return colors[currentColor];
  } else {
    let newColor = null;
    do {
      newColor = Math.floor(Math.random() * colors.length)
    } while (newColor == currentColor);
    currentColor = newColor;
    return currentColor;
  }
}

let color = getColor()

let loops = 0
async function draw() {
	loops += 1
  if (loops % 65 == 0) {
    // reset
		externalService.hsl = externalColor()
  } else if (loops % 2 == 0) {
    if (degradeService()) {
      externalService.degrade()
    }
  }

  externalService.draw(ctx);
  ctx.font = '32px serif';
  ctx.fillStyle = black;
  ctx.fillText("Service", externalService.x, externalService.y + (externalService.h / 2));

  for(j = 0; j < requests.length; j++) {
    let req = requests[j]
    req.startBox.draw(ctx);
    let path = req.paths

    let i = req.counter;
    if (i < path.length) {
      ctx.fillStyle = 'hsl(' + color + ', 100%, 50%)';
      let x = path[i][0]
      let y = path[i][1]
      ctx.fillRect(x, y, objectDimension, objectDimension)
      if ( i > 0) {
        // redraw previous square to match background and make it look like it's moving
        ctx.fillStyle = 'white';
        x = path[i - req.velocity][0]
        y = path[i - req.velocity][1]
        ctx.fillRect(x, y, objectDimension, objectDimension)
      }
    } else {
      // reset
      req.counter = 0
      color = getColor();
    }
    req.counter += req.velocity
  }
}

init();
