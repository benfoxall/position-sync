
  // shared config
  var width   = 960,
      height  = 540,
      modulus = 10000;

  // helper functions
  function el(id){return document.getElementById(id)}

  // ** Calibration code **

  // the things we are trying to find out about the client
  var x, y, offset;

  // todo - load from session storage

  // observed calibration timestamps
  var calibrations = [
    // {type, time}
  ];

  // elements 
  var 
    calibrateRight = el('calibrate-right'),
    calibrateLeft = el('calibrate-left'),
    calibrateDown = el('calibrate-down'),
    calibrateReset = el('calibrate-reset');


  // handlers for populating the calibrations array
  var handlers = (function(){
    return {
      right: make('right'),
      left: make('left'),
      down: make('down'),
      prevent: prevent
    }
    function make(name){
      return function(e){
        prevent(e)


        calibrations.push({
          type: calibrated[name] ? 'ignore' : name, 
          time: + new Date()
        })

        bean.fire(calibrations, 'modified')
      }
    }
    function prevent(e){
      if(e && e.preventDefault) e.preventDefault()
    }
  })()

  // no click for now - want make it instant
  bean.on(calibrateRight, 'mousedown touchstart', handlers.right)
  bean.on(calibrateLeft,  'mousedown touchstart', handlers.left)
  bean.on(calibrateDown,  'mousedown touchstart', handlers.down)

  // disable clicks
  bean.on(calibrateRight, 'click', handlers.prevent)
  bean.on(calibrateLeft,  'click', handlers.prevent)
  bean.on(calibrateDown,  'click', handlers.prevent)

  // resetting
  bean.on(calibrateReset, 'click', function(e){
    e.preventDefault();
    if(window.confirm("Discard calibration data?")){
      reset_calibration()
    }
  });

  bean.on(calibrations, 'modified', function(){
    calibrateReset.style.display = 'inline'
  })
  

  // ** Calibration Status **
  var calibrated = {left:null,right:null,down:null};



  // look for calibration
  function process(){

    if(!calibrated.left){
      calibrated.left = point(
        calibrations.filter(function(c){
          return c.type == 'left'
        }).map(function(d){
          return d.time
        })
      );
    }

    if(!calibrated.right){
      calibrated.right = point(
        calibrations.filter(function(c){
          return c.type == 'right'
        }).map(function(d){
          return d.time
        })
      );
    }

    if(!calibrated.down){
      calibrated.down = point(
        calibrations.filter(function(c){
          return c.type == 'down'
        }).map(function(d){
          return d.time
        })
      );
    }

    var right = calibrated.right,
        left  = calibrated.left,
        down  = calibrated.down;

    if(offset && x && y) return console.log("completed")

    if(right !== null && left !== null){

      // global
      offset = ps.average([left, right], modulus);

      // global
      // -1 -> 1
      x = (ps.distance(offset, right, modulus) / (0.25*modulus));

      // 0 -> 1
      x = (x/2)+0.5;

      // 0 -> w
      // x = x*w;

      console.log("X", x);

      if(down !== null){
        // global
        y = (ps.distance(offset, down, modulus) / (0.25*modulus));

        // 0 -> 1
        y = (y/2)+0.5;

        // 0 -> h
        // y = y*h;

        console.log("Y", y);

        localStorage.setItem('calibration', [x, y, offset].join(','))

        // debug.append('circle')
        //   .attr('r',10)
        //   .attr('cx',x)
        //   .attr('cy',y)
        //   .attr('fill','rgba(255,0,0,0.3)')
      }
    }
  }


  // the most recent averaged point
  function point(timestamps){
    // are the last two close enough to be a match?
    var last        = timestamps[timestamps.length - 1],
        penultimate = timestamps[timestamps.length - 2];

    if(last && penultimate){
      var d = ps.distance(last, penultimate, modulus);

      if(Math.abs(last - penultimate) < modulus/2){
        console.log("pre-modulation skip") //found points, but too close together (pre modulation)
        return null;
      }

      if(Math.abs(d) < modulus*0.1){//within a second?
        var avg = ps.average([last, penultimate], modulus)
        return avg;
      } else {
        console.log("post-modulation skip") // found points, but not close enough
      }
    }

    return null;

  }

  bean.on(calibrations, 'modified', process)









  // Calibration visuals


  var w = 150,
      h = 150;

  var svg = d3.select("#calibration-status").append("svg")
    .attr("width", w)
    .attr("height", h);

  var g = svg.append('g')
        .attr('transform', 'translate(' + w/2 + ', ' + h/2 + ') scale('+Math.min(w,h)/2.5+')');

  g
    .append('circle')
    .attr('r',1)
    .attr('fill','none')
    .attr('stroke','#eee')
    .attr('stroke-width',0.02)

  var points = g.selectAll('.point').data(calibrations);
  var x_line = svg.append('line').attr({
    x1:0, y1:0, x2: 0, y1: h,
    stroke: '#eee','stroke-width':1,
    transform: 'translate(-10, 0)'
  })
  var y_line = svg.append('line').attr({
    x1:0, y1:0, x2:w, y1:0,
    stroke: '#eee','stroke-width':1,
    transform: 'translate(0, -10)'
  })
  var xy_circle = svg.append('circle').attr({
    cx:-10,
    cy:-10,
    r:10,
    fill: 'rgba(0, 255, 0, 0.6)'
  })

  var modRad  = (Math.PI*2) / modulus;

  function cx(d){
    return d3.round(Math.sin(d.time*modRad),4)
  }

  function cy(d){
    return d3.round(-Math.cos(d.time*modRad),4)
  }

  function render(){
    points = points.data(calibrations)
    points
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('r', 0.1)
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('fill', function(d){
        switch(d.type){
          case 'left' : return '#ff7f0e'
          case 'right': return '#08f'
          case 'down' : return '#f08'
          case 'ignore' : return 'rgba(0,0,0,0.2)'
        }
        return '#000'
      });
    points
      .exit()
      .remove();

    if(x){
      x_line.attr('transform','translate('+ (d3.round(x*w)+0.5) + ',0)')
      xy_circle.attr('cx', (d3.round(x*w)+0.5))
    }
    if(y){
      y_line.attr('transform','translate(0, '+ (d3.round(y*h)+0.5) + ')')
      xy_circle.attr('cy', (d3.round(y*h)+0.5))
    }

    if(x && y){
      document.getElementsByTagName('html')[0].className = 'calibrated'
    }

    calibrateRight.innerHTML = calibrated.right ? 'ok' : 'right';
    calibrateLeft.innerHTML = calibrated.left ? 'ok' : 'left';
    calibrateDown.innerHTML = calibrated.down ? 'ok' : 'down';

  }


  bean.on(calibrations, 'modified', render)


  function reset_calibration(){
    x=null; y=null, offset=null; 
    calibrated = {left:null,right:null,down:null}; 
    calibrations.forEach(function(f){f.type = 'ignore'}); 

    y_line.attr('transform','translate(0, -10)');
    x_line.attr('transform','translate(-10, 0)');
    xy_circle.attr('cx', -10);
    xy_circle.attr('cy', -10);

    points.attr('fill', 'rgba(0,0,0,0.1)');

    calibrateReset.style.display = 'none'

    document.getElementsByTagName('html')[0].className = '';

    localStorage.removeItem('calibration')

    render();
  }




  // DEMOS!!!

  // ensure demo background has been loaded
  (new Image).src = 'demo-bg.jpg';

  var demoPanel   = el('demo'),
      demoClose   = el('demo-close'),
      demoTitle   = el('demo-title'),
      demoStart1  = el('demo-start-1'),
      demoStart2  = el('demo-start-2'),
      demoStart3  = el('demo-start-3'),
      bodyElement = document.getElementsByTagName('body')[0];


  var demoReset, totally;


  bean.on(demoClose, 'click', function(e){
    e.preventDefault();
    if(totally || confirm('are you, like, totally sure you want to stop this?')){
      demoPanel.style.display = 'none';
      bodyElement.style.overflow = 'auto';
      if(demoReset){
        demoReset(); demoReset = null;
      }
    }
  })

  bean.on(window, 'keyup',function(e){
    if (e.keyCode == 27){
      if(totally || confirm('are you, like, totally sure you want to stop this?')){
        demoPanel.style.display = 'none';
        bodyElement.style.overflow = 'auto';
        if(demoReset){
          demoReset(); demoReset = null;
        }
      }
    }
  })

  /*
  bean.on(demoStart1, 'click', function(e){
    e.preventDefault();
    demoPanel.style.display = 'block';
    bodyElement.style.overflow = 'hidden';
    demoTitle.innerHTML = 'Demo #1';

    demoPanel.className = 'bg-position';

    demoPanel.style.backgroundPosition = [
      Math.round((x||0)*100) + '%',
      Math.round((y||0)*100) + '%'
    ].join(' ')

    demoReset = function(){
      demoPanel.className = '';
      demoPanel.style.backgroundPosition = '';
    }
  })

  bean.on(demoStart2, 'click', function(e){
    e.preventDefault();
    demoPanel.style.display = 'block';
    bodyElement.style.overflow = 'hidden';
    demoTitle.innerHTML = 'Demo #2'

    demoPanel.style.backgroundColor = fillHSL(x||0, y||0);

    demoReset = function(){
      demoPanel.className = '';
      demoPanel.style.backgroundColor = '';
    }

  })
*/


  bean.on(demoStart3, 'click', function(e){
    e.preventDefault();
    demoPanel.style.display = 'block';
    bodyElement.style.overflow = 'hidden';
    // demoTitle.innerHTML = 'Demo #3';


    // play a blank sound for iOS to start audio
    if(window.play){
      window.play();
    }

    // create a canvas
    var canvas = document.createElement('canvas');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    demoPanel.appendChild(canvas);

    // var off;
    // if(offset === undefined){
    //   console.warn("using 0 offset");
    //   off = (+ new Date) % modulus;
    // } else {
    //   off = ((+ new Date)+offset) % modulus;
    // }

    // var drift = ((+new Date()) + offset) % modulus;

    var drift = ((+new Date()) - offset) % modulus;

    var syncDemo = new SyncDemo({
      canvas:canvas
    }, drift, x, y)

    syncDemo.start();

    demoReset = function(){
      demoPanel.removeChild(canvas)
      syncDemo.cancel();
    }

  })


  // 
  var stored = localStorage.getItem('calibration');
  if(stored){
    var parts = stored.split(',').map(parseFloat);
    x = parts[0];
    y = parts[1];
    offset = parts[2];

    render();

    console.log("used stored calibration", parts);
    bean.fire(calibrations, 'modified')
  }
  // debugging

  if(window.parent !== window){
    console.log("listening")
    window.addEventListener('message', function(e){
      
      var data = e.data || {};
      if(data.setup){
        x = data.setup.x;
        y = data.setup.y;
        offset = modulus/4;// ((+ new Date) + (modulus/4)) % modulus;

        render();
      } else if(data.demo){
        totally = true;

        demoClose.click();

        // if(data.demo === 1){
        //   demoStart1.click()
        // }
        // if(data.demo === 2){
        //   demoStart2.click()
        // }
        if(data.demo === 3){
          demoStart3.click()
        }
      } else {
        console.log("unhandled message ", data)
      }

    }, false)
  }


  function paintHSL(){
    g.remove()
    for (var x = 0.95; x >= 0; x-=0.05) {
      for (var y = 0.95; y >= 0; y-=0.05) {
        // var xr = (x-.5)*2,
        //     yr = (y-.5)*2;

        svg
          .append('circle')
          .attr({
            r:2, 
            cx: x*w,
            cy: y*h,
            fill: fillHSL(x,y)
          })
      }
    };
  }

  // paintHSL()

  // return an hsl fill based on the position of the client
  function fillHSL(_x,_y){
    var x    = (_x*2)-1,
        y    = (_y*2)-1,
        a    = Math.atan2(x, y),
        d    = Math.sqrt((x*x)+(y*y));

    // convert / constrain
    a = (a + Math.PI*2) % (Math.PI*2);

    // 0..2PI -> 0..360
    a = (a/Math.PI) * 180

    if(d > 1) d = 1;

    return 'hsl('+d3.round(a)+', '+d3.round(d*100)+'%, 50%)'
  }
