var c = document.getElementById("animation");
var ctx = c.getContext("2d");
var cH;
var cW;
var bgColor = "#FF6138";
var animations = [];
var circles = [];

var colorPicker = (function() {
  var colors = ["#FF6138", "#FFBE53", "#2980B9", "#282741"];
  var index = 0;
  function next() {
    index = index++ < colors.length-1 ? index : 0;
    return colors[index];
  }
  function current() {
    return colors[index]
  }
  return {
    next: next,
    current: current
  }
})();

function removeAnimation(animation) {
  var index = animations.indexOf(animation);
  if (index > -1) animations.splice(index, 1);
}

function calcPageFillRadius(x, y) {
  var l = Math.max(x - 0, cW - x);
  var h = Math.max(y - 0, cH - y);
  return Math.sqrt(Math.pow(l, 2) + Math.pow(h, 2));
}

function addClickListeners() {
  // document.addEventListener("touchstart", handleEvent);
  // document.addEventListener("mousedown", handleEvent);
};

function handleEvent(e) {
  console.log("Got event")
    if (e.touches) {
      e.preventDefault();
      e = e.touches[0];
    }
    var currentColor = colorPicker.current();
    var nextColor = colorPicker.next();
    var targetR = calcPageFillRadius(e.pageX, e.pageY);
    var rippleSize = Math.min(200, (cW * .4));
    var minCoverDuration = 750;

    var pageFill = new Circle({
      x: e.pageX,
      y: e.pageY,
      r: 0,
      fill: nextColor
    });
    var fillAnimation = anime({
      targets: pageFill,
      r: targetR,
      duration:  Math.max(targetR / 2 , minCoverDuration ),
      easing: "easeOutQuart",
      complete: function(){
        bgColor = pageFill.fill;
        removeAnimation(fillAnimation);
      }
    });

    var ripple = new Circle({
      x: e.pageX,
      y: e.pageY,
      r: 0,
      fill: currentColor,
      stroke: {
        width: 3,
        color: currentColor
      },
      opacity: 1
    });
    var rippleAnimation = anime({
      targets: ripple,
      r: rippleSize,
      opacity: 0,
      easing: "easeOutExpo",
      duration: 900,
      complete: removeAnimation
    });

    var particles = [];
    for (var i=0; i<32; i++) {
      var particle = new Circle({
        x: e.pageX,
        y: e.pageY,
        fill: currentColor,
        r: anime.random(24, 48)
      })
      particles.push(particle);
    }
    var particlesAnimation = anime({
      targets: particles,
      x: function(particle){
        return particle.x + anime.random(rippleSize, -rippleSize);
      },
      y: function(particle){
        return particle.y + anime.random(rippleSize * 1.15, -rippleSize * 1.15);
      },
      r: 0,
      easing: "easeOutExpo",
      duration: anime.random(1000,1300),
      complete: removeAnimation
    });
    animations.push(fillAnimation, rippleAnimation, particlesAnimation);
}

function extend(a, b){
  for(var key in b) {
    if(b.hasOwnProperty(key)) {
      a[key] = b[key];
    }
  }
  return a;
}

var Circle = function(opts) {
  extend(this, opts);
}

Circle.prototype.draw = function() {
  ctx.globalAlpha = this.opacity || 1;
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
  if (this.stroke) {
    ctx.strokeStyle = this.stroke.color;
    ctx.lineWidth = this.stroke.width;
    ctx.stroke();
  }
  if (this.fill) {
    ctx.fillStyle = this.fill;
    ctx.fill();
  }
  ctx.closePath();
  ctx.globalAlpha = 1;
}



var resizeCanvas = function() {
  cW = window.innerWidth;
  cH = window.innerHeight;
  c.width = cW * devicePixelRatio;
  c.height = cH * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
};

function init() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  addClickListeners();
  setInterval(draw, 180) // 180 for slow
  if (!!window.location.pathname.match(/fullcpgrid/)) {
    startFauxClicking();
  }
  handleInactiveUser();
}

function handleInactiveUser() {
  var inactive = setTimeout(function(){
    fauxClick(cW/2, cH/2);
  }, 2000);

  function clearInactiveTimeout() {
    clearTimeout(inactive);
    document.removeEventListener("mousedown", clearInactiveTimeout);
    document.removeEventListener("touchstart", clearInactiveTimeout);
  }

  document.addEventListener("mousedown", clearInactiveTimeout);
  document.addEventListener("touchstart", clearInactiveTimeout);
}

function startFauxClicking() {
  setTimeout(function(){
    fauxClick(anime.random( cW * .2, cW * .8), anime.random(cH * .2, cH * .8));
    startFauxClicking();
  }, anime.random(200, 900));
}

function fauxClick(x, y) {
  var fauxClick = new Event("mousedown");
  fauxClick.pageX = x;
  fauxClick.pageY = y;
  document.dispatchEvent(fauxClick);
}

var container = {
	x: 0,
	y: 0,
	width: 600,
	height: 300
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

class ExtendedCircle {
  constructor(x, y, radius, startAngle, endAngle, counterclockwise, vx, vy) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.counterclockwise = counterclockwise;
    this.vx = vx;
    this.vy = vy;
  }

  setCtx(c) {
    this.ctx = c
  }

  toString() {
    console.log(
      x,
      y,
    )
  }

  draw() {
    this.ctx.fillStyle = black;
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.radius, this.startAngle, this.endAngle, this.counterclockwise);
    this.ctx.fill();
  }

  move() {
    this.x += this.vx;
    this.y += this.vy;
  }
}

var black = "#000000";

function externalColor() {
  return new Color(147, 50, 47);
}

var externalService = new Box(450, 100, 70, 100, externalColor());
var jobColor = new Color(300, 76, 72);
// ctx.fillStyle = `hsl(300, 76%, 72%)`

var jobs = [
  new Box(10, 10, 30, 30, jobColor),
  new Box(10, 50, 30, 30, jobColor),
  new Box(10, 90, 30, 30, jobColor),
  new Box(10, 130, 30, 30, jobColor),
  new Box(10, 170, 30, 30, jobColor),
  new Box(10, 210, 30, 30, jobColor),
  new Box(10, 250, 30, 30, jobColor),
]


var grid = new PF.Grid(120, 60);

console.log("external: ", externalService)
function getPaths(jS, eS) {
  var gridBackup = grid.clone();
  var finder = new PF.AStarFinder();
  var path = finder.findPath(jS.x / 5, jS.y / 5, eS.mid()[0] / 5, eS.mid()[1] / 5, gridBackup);
  return path.map(p => [p[0] * 5, p[1] * 5])
}
class Request {
  constructor(paths, startBox, velocity) {
    this.paths  = paths;
    this.startBox = startBox;
    this.velocity = velocity;
    this.counter = 0;
  }
}

var steps = 25;

var requests = jobs.map(j => {
  let paths = getPaths(j, externalService)
  let velocity = Math.ceil(paths.length / steps)
  return new Request(
    paths,
    j,
    velocity
  )
})

console.log(requests)


function init2() {
  setInterval(draw, 50) // 180 for slow
}


var colors = [
  125,
  205,
  25,
  100,
]

var currentColor = null;
function getColor() {
  if (currentColor == null) {
    currentColor = Math.floor(Math.random() * colors.length)
    return colors[currentColor];
  } else {
    var newColor = null;
    do {
      newColor = Math.floor(Math.random() * colors.length)
    } while (newColor == currentColor);
    currentColor = newColor;
    return currentColor;
  }
}

var color = getColor()

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

var loops = 0

async function draw() {

  var canvas = document.getElementById('animation');
  var ctx = canvas.getContext('2d');

	var animate = anime({
		duration: Infinity,
		update: function() {
			// ctx.fillStyle = bgColor;
			// ctx.fillRect(0, 0, cW, cH);
			animations.forEach(function(anim) {
				anim.animatables.forEach(function(animatable) {
					animatable.target.draw();
				});
			});
		}
	});
	loops += 1
  if (loops % 100 == 0) {
    // reset
    // console.log("reset color on external service")
		// externalService.hsl = externalColor()
    // console.log("es...", externalService)
    //
    // let event = new MouseEvent("mousedown", {
    //   bubbles: true,
    //   clientX: externalService.x,
    //   clientY: externalService.y,
    // })
    // console.log(event);
    // canvas.dispatchEvent(event)
  } else if (loops % 2 == 0) {
    // externalService.degrade()
  }

  externalService.draw(ctx);
  ctx.font = '32px serif';
  ctx.fillStyle = black;
  ctx.fillText("Service", externalService.x, externalService.y + (externalService.h / 2));

  for(j = 0; j < requests.length; j++) {
    let req = requests[j]
    req.startBox.draw(ctx);
    var path = req.paths

    var i = req.counter;
    if (i < path.length) {
      ctx.fillStyle = 'hsl(' + color + ', 100%, 50%)';
      let x = path[i][0]
      let y = path[i][1]
      ctx.fillRect(x, y, 5, 5)
      if ( i > 0) {
        // clear previous square to make it look like it's moving
        ctx.fillStyle = 'white';
        x = path[i-req.velocity][0]
        y = path[i-req.velocity][1]
        ctx.fillRect(x, y, 5, 5)
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
