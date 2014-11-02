(function(){

  // This generates a stepper that I can only really describe when
  // I'm at a whiteboard and have three different coloured pens
  function generateStepper(steps, initial){
    var c = steps * initial * 2 * Math.PI;
    return function(i){
      return (-Math.cos((~~(i * steps)+1) * i * c) + 0.5)
    }
  }

  var stepper = generateStepper(5,1);


  function notify(message){
    return function(){
      console.log(message)
    }
  }

  var width = 100, height=100;

  function fill(ctx, colour){
    ctx.fillStyle = colour;
    ctx.fillRect(0,0, width, height)
  }

  // 0->1, #000000 -> #ffffff
  function grey(v){
    
    // snap to black/white
    v = v < 0.2 ? 0 : v > 0.8 ? 1 : v

    var g = (~~(v*255)).toString(16);

    if(g.length == 1) g = '0' + g;

    return '#' + g + g + g;
  }


  // h - 0..2PI, s - 0..1, l - 0..1
  function hsl(h, s, l){
    // var x    = (_x*2)-1,
        // y    = (_y*2)-1,
        // a    = Math.atan2(x, y),
        // d    = Math.sqrt((x*x)+(y*y));

    // convert / constrain
    // if(h < 0) h = (h + Math.PI*2) % (Math.PI*2);
    // h = h % Math.PI*2;

    h = (h + Math.PI*2) % (Math.PI*2);

    // 0->2PI -> 0->360
    h = (h/Math.PI)*180;

    if(s > 1) s = 1;
    if(l > 1) l = 1;

    return 'hsl('+Math.round(h)+', '+Math.round(s*100)+'%, '+(l*100)+'%)'
  }






	function SyncDemo(canvas, offset, x, y){
    var ctx = canvas.getContext('2d');
    width = canvas.width;
    height = canvas.height;

    if(typeof(offset) == 'undefined'){
      console.warn('undefined offset')
      offset = 0
    }
    if(typeof(x) == 'undefined'){
      console.warn('no coordinates given')
      // bottom right
      x = 1;
      y = 1;
    }
    

    //
    // initial (out of sync) flashing
    //
    false && this.queue(
      new TWEEN.Tween({t:0})
        .onStart(notify('started'))

        .to({t:1}, 15000)
        .onUpdate(function() {
          fill(ctx,grey(stepper(this.t)));
        })
        .repeat(1) // twice
    )

    //
    // catchup cycles
    //
    var cycles = 1,
        cycleDuration = 15000 - (offset/cycles);

    console.log("cycleOffset", offset/cycles)
    console.log("cycleDuration", cycleDuration)
    if(cycleDuration<0) console.error("cycle duration is negative")

    this.queue(
      new TWEEN.Tween({t:0})

        .to({t:1}, cycleDuration)
        .onStart(notify('started syncing'))
        .onUpdate(function() {
          fill(ctx,grey(stepper(this.t)))
        })
        .repeat(cycles-1)
    )

    // in sync flashing
    this.queue(
      new TWEEN.Tween({t:0})

        .to({t:1}, 15000)
        .onStart(notify('started in-sync flashing'))
        .onUpdate(function() {
          fill(ctx,grey(stepper(this.t)));

        })
        .repeat(1) // twice
    )

    // blank
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 10000)
        .onStart(notify('blank'))
        .onUpdate(function() {
          fill(ctx,'#000');
        })
    )


    // blank -> hsv
    var _x    = (x*2)-1,
        _y    = (y*2)-1,
        a    = Math.atan2(_x, _y),
        d    = Math.sqrt((_x*_x)+(_y*_y));


    console.log(a,d)

    // hsv in
    this.queue(
      new TWEEN.Tween({l:0})
        .to({l:.5}, 5000)
        .onStart(notify('blank'))
        .onUpdate(function() {

          fill(ctx,hsl(a,d,this.l));
        })
    )

    // hsv rotate
    this.queue(
      new TWEEN.Tween({a:0})
        .to({a:Math.PI*4}, 20000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onStart(notify('blank'))
        .onUpdate(function() {

          fill(ctx,hsl(a+this.a,d,.5));
        })
        .repeat(1)
        .yoyo(true)
    )

	}

  SyncDemo.prototype.queue = function(tween){
    if(!this.firstTween) 
      return this.firstTween = this.lastTween = tween

    this.lastTween.chain(this.lastTween = tween)
  }

	SyncDemo.prototype.cancel = function(){
    TWEEN.removeAll();
    stopRendering();
	}

	SyncDemo.prototype.start = function(){
    this.firstTween.start();
    startRendering();
	}



  // a global rendering thing (calls tween update on rAF)
  var isRendering, kill;
  function startRendering(){
    if(isRendering) return;
    isRendering = true; kill = false; 
    render()
  }
  function stopRendering(){
    if(!isRendering) return;
    kill = true;
  }

  function render(){
    if(kill) return kill = isRendering = false;
    requestAnimationFrame(render);

    TWEEN.update();
  }


	window.SyncDemo = SyncDemo;

})();

