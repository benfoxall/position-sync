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



	function SyncDemo(canvas, offset){
    var ctx = canvas.getContext('2d');

    //
    // initial (out of sync) flashing
    //
    this.queue(
      new TWEEN.Tween({t:0})
        .onStart(notify('started'))

        .to({t:1}, 15000)
        .onUpdate(function() {

          var v = stepper(this.t);
          if(v < 0.2) v = 0;
          if(v > 0.8) v = 1;

          var g = (~~(v*255)).toString(16);

          if(g.length == 1) g = '0' + g;

          ctx.fillStyle = '#' + g + g + g;
          ctx.fillRect(0,0,canvas.width, canvas.height)

        })
        .repeat(1) // twice
    )

    //
    // catchup cycles
    //
    var cycles = 2,
        cycleDuration = 15000 - (offset/cycles);

    console.log("cycleOffset", offset/cycles)
    console.log("cycleDuration", cycleDuration)

    if(cycleDuration<0) console.error("cycle duration is negative")

    this.queue(
      new TWEEN.Tween({t:0})

        .to({t:1}, cycleDuration)
        .onStart(notify('started syncing'))
        .onUpdate(function() {

          var v = stepper(this.t);
          if(v < 0.2) v = 0;
          if(v > 0.8) v = 1;

          var g = (~~(v*255)).toString(16);

          if(g.length == 1) g = '0' + g;

          ctx.fillStyle = '#' + g + g + g;
          ctx.fillRect(0,0,canvas.width, canvas.height)

        })
        .repeat(cycles-1)
    )

    // in sync flashing
    this.queue(
      new TWEEN.Tween({t:0})

        .to({t:1}, 15000)
        .onStart(notify('started in-sync flashing'))
        .onUpdate(function() {

          var v = stepper(this.t);
          if(v < 0.2) v = 0;
          if(v > 0.8) v = 1;

          var g = (~~(v*255)).toString(16);

          if(g.length == 1) g = '0' + g;

          ctx.fillStyle = '#' + g + g + g;
          ctx.fillRect(0,0,canvas.width, canvas.height)

        })
        .repeat(1) // twice
    )



    // this.tween = new TWEEN.Tween({t:0})

    // this.tween
    //     .to({t:1}, 15000)
    //     .onUpdate(function() {

    //       var v = stepper(this.t);
    //       if(v < 0.2) v = 0;
    //       if(v > 0.8) v = 1;

    //       var g = (~~(v*255)).toString(16);

    //       if(g.length == 1) g = '0' + g;

    //       ctx.fillStyle = '#' + g + g + g;
    //       ctx.fillRect(0,0,canvas.width, canvas.height)

    //     })
    //     .repeat(1)// will go on n+1 times
    //     // .start()


    //   var catchup = new TWEEN.Tween({t:0}),
    //       cycles = 2,
    //       cycleDuration = 15000 - (offset/cycles);

    //   console.log("cycleDuration", cycleDuration)

    //   if(cycleDuration<0){
    //     console.error("cycle duration is negative");
    //   }

    //   catchup
    //     .to({t:1}, cycleDuration)
    //     .onUpdate(function() {

    //       var v = stepper(this.t);
    //       if(v < 0.2) v = 0;
    //       if(v > 0.8) v = 1;

    //       var g = (~~(v*255)).toString(16);

    //       if(g.length == 1) g = '0' + g;

    //       ctx.fillStyle = '#' + g + g + g;
    //       ctx.fillRect(0,0,canvas.width, canvas.height)

    //     })
    //     .repeat(cycles-1);


    //   this.tween.chain(catchup)



    //   var synced = new TWEEN.Tween({t:0});

    //   synced
    //     .to({t:1}, 15000)
    //     .onUpdate(function() {

    //       var v = stepper(this.t);
    //       if(v < 0.2) v = 0;
    //       if(v > 0.8) v = 1;

    //       var g = (~~(v*255)).toString(16);

    //       if(g.length == 1) g = '0' + g;

    //       ctx.fillStyle = '#' + g + g + g;
    //       ctx.fillRect(0,0,canvas.width, canvas.height)

    //     })
    //     // .repeat(3)// will go on n+1 times
    //     // .start()

    //   catchup.chain(synced)
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

