(function(){

  var demoBGImage = new Image();
  demoBGImage.src="demo-bg.jpg";

  // draw an image to canvas, hooking to xy position
  function drawFit(src_img, dest_canvas, x, y, scale, ctx){
    var src_w = src_img.width* scale,
        src_h = src_img.height* scale,
        dest_w = dest_canvas.width,
        dest_h = dest_canvas.height;

    var t_x = (src_w - dest_w)*x;
    var t_y = (src_h - dest_h)*y;

    (ctx||dest_canvas.getContext('2d')).drawImage(src_img, t_x/scale, t_y/scale, src_w/scale, src_h/scale, 0, 0, src_w, src_h)
  }


  var play = noop;

  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    window.context = parent.context || new AudioContext();

    var play = window.play = (function(sounds){

        var buffers = {}, firstLoaded;

        for(sound in sounds){
            if(sounds.hasOwnProperty(sound))
                request(sound, sounds[sound]) // load it
            
        }

        return function play(name){
            if(!name && firstLoaded){

              var buffer = buffers[firstLoaded];
              var source = context.createBufferSource();
              var gainNode = context.createGain();
              gainNode.gain.value = 0.05;
              source.buffer = buffer;
              source.connect(gainNode);
              gainNode.connect(context.destination);

              console.log("playing blank", firstLoaded)

              return;
            }

            var buffer = buffers[name];
            if(buffer){
                  var source = context.createBufferSource();
                  source.buffer = buffer;
                  source.connect(context.destination);
                  source.start(0);
            }
        }

        function request(name,url){
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.responseType = 'arraybuffer';

          // Decode asynchronously
          xhr.onload = function() {
            context.decodeAudioData(xhr.response, function(buffer) {
              buffers[name] = buffer;
              if(!firstLoaded) firstLoaded = name;
            }, function(e){
                console.log("an error occured requesting ", url, e)
            });
          }
          xhr.send();
        }
    })({
        'bubbles': '_bubbles.mp3',
        'spiral': '_dotted-spiral.mp3',
        'clap': '_clap.mp3',
        'ting': '_ting.mp3',
    })

  } catch (e) {
    console.log("couldn't load audio", e)
  }





  // This generates a stepper that I can only really describe when
  // I'm at a whiteboard and have three different coloured pens
  function generateStepper(steps, initial){
    var c = steps * initial * 2 * Math.PI;
    return function(i){
      return (-Math.cos((~~(i * steps)+1) * i * c) + 0.5)
    }
  }

  var stepper = generateStepper(5,1);
  var stepper10 = generateStepper(1,6);


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

  // h - [0,360], s - [0,1], l - [0,1]
  function hsl_basic(h,s,l){
    h = h % 360; // s = s % 1; l = l % 1;
    return 'hsl('+Math.round(h)+', '+Math.round(s*100)+'%, '+(l*100)+'%)'
  }






	function SyncDemo(ui, offset, x, y, master){
    // pull out the ui
    this.canvas = ui.canvas;
    this.footer = ui.footer;
    this.offset = offset;
    this.x = x;
    this.y = y;

    this.master = !!master;


    var ctx = this.ctx = this.canvas.getContext('2d');
    width = this.canvas.width;
    height = this.canvas.height;

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


    // add each of the steps

    this.blank(10000)

    this._screenshare();

    this.blank(20000)

    this._positionColours();

    this.blank(10000)

    this._syncronisation();
    // this._syncronisation_short();


    this.blank(10000)

    this._movingColours();

    this.blank(15000)

    this._movement();

    this.blank(10000)

    this._capabilitySharing();

    this.blank(10000)

    this._capabilityCombining();




    return;

    //
    // initial (out of sync) flashing
    //
    this.queue(
      new TWEEN.Tween({t:0})
        .onStart(notify('started'))

        .to({t:1}, 15000)
        .onUpdate(master?noop: function() {
          fill(ctx,grey(stepper(this.t)));
        })
        .repeat(1) // twice
    )

    //
    // catchup cycles
    //
    var cycles = 1,
        cycleDuration = 10000 - (offset/cycles);

    console.log("cycleOffset", offset/cycles)
    console.log("cycleDuration", cycleDuration)
    if(cycleDuration<0) console.error("cycle duration is negative")

    this.queue(
      new TWEEN.Tween({t:0})

        .to({t:1}, cycleDuration)
        .onStart(notify('started syncing'))
        .onUpdate(master?noop:function() {
          fill(ctx,grey(stepper(this.t)))
        })
        .repeat(cycles-1)
    )

    // in sync flashing
    this.queue(
      new TWEEN.Tween({t:0})

        .to({t:1}, 15000)
        .onStart(notify('started in-sync flashing'))
        .onUpdate(master?noop:function() {
          fill(ctx,grey(stepper(this.t)));

        })
        // .repeat(1) // twice
    )

    // blank
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 10000)
        .onStart(notify('blank'))
        .onUpdate(master?noop:function() {
          fill(ctx,'#000');
        })
    )


    // blank -> hsv
    var _x    = (x*2)-1,
        _y    = (y*2)-1,
        a    = Math.atan2(_x, _y),
        a2   = a,
        d    = Math.sqrt((_x*_x)+(_y*_y));


    if(a2 < 0){
      a2   = (a + Math.PI*2);// % Math.PI*2 // 0 -> Math.PI*2
    }


    // console.log(_x, y, a, a2)

    if(true){

      // hsv in
      this.queue(
        new TWEEN.Tween({l:0})
          .to({l:.5}, 3000)
          .onStart(notify('blank'))
          .onUpdate(master?noop:function() {

            fill(ctx,hsl(a,d,this.l));
          })
      )

      // hsv rotate
      this.queue(
        new TWEEN.Tween({a:0})
          .to({a:Math.PI*4}, 20000)
          .easing(TWEEN.Easing.Cubic.InOut)
          .onStart(notify('blank'))
          .onUpdate(master?noop:function() {

            fill(ctx,hsl(a+this.a,d,.5));
          })
          // .repeat(1)
          // .yoyo(true)
      )

      // hsv out
      this.queue(
        new TWEEN.Tween({l:0.5})
          .to({l:0}, 2000)
          .onStart(notify('blank'))
          .onUpdate(master?noop:function() {

            fill(ctx,hsl(a,d,this.l));
          })
      )


      // 'on' rotate
      this.queue(
        new TWEEN.Tween({a:-1})
          .to({a:(Math.PI*2)+1}, 10000)
          .easing(TWEEN.Easing.Linear.None)
          .onStart(notify('blank'))
          .onUpdate(master?noop:function() {
            fill(ctx,grey(a2 > this.a ? 0 : 1));
          })
      )


      // 'off' rotate
      this.queue(
        new TWEEN.Tween({a:-1})
          .to({a:(Math.PI*2)+1}, 10000)
          .easing(TWEEN.Easing.Linear.None)
          .onStart(notify('blank'))
          .onUpdate(master?noop:function() {
            fill(ctx,grey(a2 > this.a ? 1 : 0));
          })
      )

      // blank
      this.queue(
        new TWEEN.Tween({t:0})
          .to({t:1}, 5000)
          .onStart(notify('blank'))
          .onUpdate(master?noop:function() {
            fill(ctx,'#000');
          })
      )

    }

    // master audio
    if(true){

      // on with beat from master
      this.queue(
        new TWEEN.Tween({t:0})
          .to({t:1}, 500)
          .onStart(master ? function(){play('bubbles')} : noop)
          .onUpdate(master?noop:function() {
            fill(ctx,grey(this.t));
          })
      )

      // blank (white)
      this.queue(
        new TWEEN.Tween({t:0})
          .to({t:1}, 1000)
          .onUpdate(master?noop:function() {
            fill(ctx,'#fff');
          })
      )

      // off with a beat from the master
      this.queue(
        new TWEEN.Tween({t:1})
          .to({t:0}, 500)
          .onStart(master ? function(){play('bubbles')} : noop)
          .onUpdate(master?noop:function() {
            fill(ctx,grey(this.t));
          })
      )


      // blank (black)
      this.queue(
        new TWEEN.Tween({t:0})
          .to({t:1}, 5000)
          .onUpdate(master?noop:function() {
            fill(ctx,'#000');
          })
      )


      // up with beat from master
      this.queue(
        new TWEEN.Tween({t:1})
          .to({t:0}, 1000)
          .onStart(master ? function(){play('bubbles')} : noop)
          .onUpdate(master?noop:function() {
            fill(ctx,grey(this.t > y ? 0 : 1));
          })
      )

      // blank (white)
      this.queue(
        new TWEEN.Tween({t:0})
          .to({t:1}, 1000)
          .onUpdate(master?noop:function() {
            fill(ctx,'#fff');
          })
      )


      // left with beat from master
      this.queue(
        new TWEEN.Tween({t:1})
          .to({t:0}, 1000)
          .onStart(master ? function(){play('bubbles')} : noop)
          .onUpdate(master?noop:function() {
            fill(ctx,grey(this.t > x ? 1 : 0));
          })
      )


      // blank (black)
      this.queue(
        new TWEEN.Tween({t:0})
          .to({t:1}, 1000)
          .onUpdate(master?noop:function() {
            fill(ctx,'#000');
          })
      )

      // right with beat from master
      this.queue(
        new TWEEN.Tween({t:0})
          .to({t:1}, 1000)
          .onStart(master ? function(){play('bubbles')} : noop)
          .onUpdate(master?noop:function() {
            fill(ctx,grey(this.t > x ? 1 : 0));
          })
      )

      // blank (white)
      this.queue(
        new TWEEN.Tween({t:0})
          .to({t:1}, 1000)
          .onUpdate(master?noop:function() {
            fill(ctx,'#fff');
          })
      )


      // right -> black with beat from master
      this.queue(
        new TWEEN.Tween({t:0})
          .to({t:1}, 1000)
          .onStart(master ? function(){play('bubbles')} : noop)
          .onUpdate(master?noop:function() {
            fill(ctx,grey(this.t > x ? 0 : 1));
          })
      )

      // blank (black)
      this.queue(
        new TWEEN.Tween({t:0})
          .to({t:1}, 1000)
          .onUpdate(master?noop:function() {
            fill(ctx,'#000');
          })
      )

      // on with beat from master
      this.queue(
        new TWEEN.Tween({t:0})
          .to({t:1}, 100)
          .onStart(master ? function(){play('bubbles')} : noop)
          .onUpdate(master?noop:function() {
            fill(ctx,grey(this.t));
          })
      )

      // blank (white)
      this.queue(
        new TWEEN.Tween({t:0})
          .to({t:1}, 2000)
          .onUpdate(master?noop:function() {
            fill(ctx,'#fff');
          })
      )

      // down with fizz from master
      this.queue(
        new TWEEN.Tween({t:0})
          .to({t:1}, 2000)
          .onStart(master ? function(){play('spiral')} : noop)
          .onUpdate(master?noop:function() {
            fill(ctx,grey(this.t < y ? 1 : 0));
          })
      )

      // blank (black)
      this.queue(
        new TWEEN.Tween({t:0})
          .to({t:1}, 10000)
          .onUpdate(master?noop:function() {
            fill(ctx,'#000');
          })
      )


    } // master audio



    // sound moving down
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 3000)
        .onStart(master ? noop : function(){setTimeout(function(){play('bubbles')}, y*3000)})
        .onUpdate(noop)
    )



    // blank (black)
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 4000)
        .onUpdate(master?noop:function() {
          fill(ctx,'#000');
        })
    )


    // sound moving around
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 10000)
        .onStart(master ? noop : function(){setTimeout(function(){
          play('bubbles');
          // fill(ctx,'#fff');
        }, (a2/(Math.PI*2))*10000)})
        .onUpdate(noop)
    )


    // blank (black)
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 4000)
        .onUpdate(master?noop:function() {
          fill(ctx,'#000');
        })
    )


    // sound moving around with light
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 10000)
        .onStart(master ? noop : function(){setTimeout(function(){
          play('bubbles');
          fill(ctx,'#fff');
        }, (a2/(Math.PI*2))*10000)})
        .onUpdate(noop)
    )


    // fizz (at same time) back to the bottom
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 2000)
        .onStart(master ? noop: function(){play('spiral')})
        .onUpdate(master?noop:function() {
          fill(ctx,grey(this.t < y ? 1 : 0));
        })
    )
	}



  /* 
    Show the image of my bedroom in the snow
  */

  SyncDemo.prototype._screenshare = function(){
    var self = this;

    this.footerHTML('screenshare');

    this.blank(10000)

    this.queue(
      new TWEEN.Tween({a:0})
      .to({a:1}, 2000)
      .onStart(this.master?noop:function(){
        self.canvas.style.opacity = 0;
        drawFit(demoBGImage, self.canvas, self.x, self.y, 1.5);
      })
      .onUpdate(this.master?noop:function(){
        self.canvas.style.opacity = this.a;
      })
      .onComplete(this.master?noop:function(){
        self.canvas.style.opacity = 1;
      })
    )

    this.blank(30000)

    // fade in the image on the master
    this.queue(
      new TWEEN.Tween({a:0})
      .to({a:1}, 2000)
      .onStart(!this.master?noop:function(){
        self.canvas.style.opacity = 0;
        self.ctx.drawImage(demoBGImage, 0, 0, self.canvas.width,self.canvas.height);
      })
      .onUpdate(!this.master?noop:function(){
        self.canvas.style.opacity = this.a;
      })
      .onComplete(!this.master?noop:function(){
        self.canvas.style.opacity = 1;
      })
    )


    this.blank(30000)

    // fade out both
    this.queue(
      new TWEEN.Tween({a:1})
      .to({a:0}, 2000)
      .onUpdate(function(){
        self.canvas.style.opacity = this.a;
      })
      .onComplete(function(){
        self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height)
        self.canvas.style.opacity = 1;
      })
    )

    this.footerHTML('');
  };


  /*
    Show rainbows based on position
  */

  SyncDemo.prototype._positionColours = function(){
    var ctx = this.ctx;

    // red to green

    this.footerHTML("using the environment")

    this.blank(10000)

    // hsl across
    this.queue(
      new TWEEN.Tween({h:0,s:1,l:0})
        .to({h:this.x * 120,s:1,l:0.5}, 5000)
        .onUpdate(this.master?noop:function() {
          fill(ctx,hsl_basic(this.h,this.s,this.l));
        })
    )

    this.blank(10000)


    // hsl up
    this.queue(
      new TWEEN.Tween({h:this.x * 120,s:1,l:0.5})
        .to({h:this.y * 120,s:1,l:0.5}, 5000)
        .onUpdate(this.master?noop:function() {
          fill(ctx,hsl_basic(this.h,this.s,this.l));
        })
    )

    this.blank(10000)

    // black
    this.queue(
      new TWEEN.Tween({h:this.y * 120,s:1,l:0.5})
        .to({h:0,s:0,l:0}, 5000)
        .onUpdate(this.master?noop:function() {
          fill(ctx,hsl_basic(this.h,this.s,this.l));
        })
    )

    this.blank(10000)

    this.footerHTML("")

  };



  /*
    Syncronisation
  */
  SyncDemo.prototype._syncronisation = function(){
    var ctx = this.ctx,
        cycles = 1,
        cycleDuration = 20000 - (this.offset/cycles);

    this.footerHTML('syncronisation <small>Warning: flashing phones</small>');

    this.blank(13000)

    // initial (out of sync) flashing
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 20000)
        .onUpdate(this.master?noop: function() {
          fill(ctx,grey(stepper10(this.t)));
        })
    )

    //out of sync colours
    this.queue(
      new TWEEN.Tween({t:0,h:0})
        .to({t:1,h:360}, 10000)
        .onUpdate(this.master?noop: function() {
          fill(ctx,hsl_basic(this.h,1,0.3*stepper10(this.t)));
        })
    )

    this.blank(10000)

    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, cycleDuration)
        // .onStart(notify('started syncing'))
        .onUpdate(this.master?noop:function() {
          fill(ctx,grey(stepper10(this.t)))
        })
        .repeat(cycles-1)
    )

    this.footerHTML('syncronisation!');

    this.blank(10000)

    // in sync
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 20000)
        .onUpdate(this.master?noop: function() {
          fill(ctx,grey(stepper10(this.t)));
        })
    )

    // colour flashing
    this.queue(
      new TWEEN.Tween({t:0,h:0})
        .to({t:1,h:360}, 20000)
        .onUpdate(this.master?noop: function() {
          fill(ctx,hsl_basic(this.h,1,0.3*stepper10(this.t)));
        })
    )

    this.footerHTML('');

  };




  /*
    Syncronisation
  */
  SyncDemo.prototype._syncronisation_short = function(){
    var ctx = this.ctx,
        cycles = 1,
        cycleDuration = 10000 - (this.offset/cycles);

    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, cycleDuration)
        .onStart(notify('started syncing'))
        .onUpdate(this.master?noop:function() {
          fill(ctx,grey(stepper10(this.t)))
        })
        .repeat(cycles-1)
    )

    this.footerHTML('synced!');

  };



  /*
    Moving rainbow colours
  */
  SyncDemo.prototype._movingColours = function(){

    var ctx = this.ctx;

    this.footerHTML("position &amp; time &rarr; colour")

    this.blank(10000)

    // hsl across (static)
    this.queue(
      new TWEEN.Tween({h:0,s:1,l:0})
        .to({h:this.x * 120,s:1,l:0.5}, 5000)
        .onUpdate(this.master?noop:function() {
          fill(ctx,hsl_basic(this.h,this.s,this.l));
        })
    )

    // hsl across + back (moving)
    this.queue(
      new TWEEN.Tween({h:this.x * 120,s:1,l:0.5})
        .to({h:(this.x * 120)+240,s:1,l:0.5}, 10000)
        .onUpdate(this.master?noop:function() {
          fill(ctx,hsl_basic(this.h,this.s,this.l));
        })
        .repeat(1)
        .yoyo(true)
    )

    this.blank(5000)

    // hsl up (static)
    this.queue(
      new TWEEN.Tween({h:this.x * 120,s:1,l:0.5})
        .to({h:this.y * 120,s:1,l:0.5}, 5000)
        .onUpdate(this.master?noop:function() {
          fill(ctx,hsl_basic(this.h,this.s,this.l));
        })
    )

    // hsl up (moving)
    this.queue(
      new TWEEN.Tween({h:this.y * 120,s:1,l:0.5})
        .to({h:(this.y * 120)+240,s:1,l:0.5}, 5000)
        .onUpdate(this.master?noop:function() {
          fill(ctx,hsl_basic(this.h,this.s,this.l));
        })
        .repeat(1)
        .yoyo(true)
    )

    this.blank(5000)

     // black
    this.queue(
      new TWEEN.Tween({h:this.y * 120,s:1,l:0.5})
        .to({h:0,s:0,l:0}, 5000)
        .onUpdate(this.master?noop:function() {
          fill(ctx,hsl_basic(this.h,this.s,this.l));
        })
    )

    this.blank(10000)

    this.footerHTML("")

  }

  /*
    Moving up down, then rotating
  */
  SyncDemo.prototype._movement = function(){
    var ctx = this.ctx,
        x = this.x,
        y = this.y,
        a    = Math.atan2(x-.5, y-.5);
    if(a < 0){
      a   = (a + Math.PI*2);// 0 -> Math.PI*2
    }


    this.footerHTML("movement")

    this.blank(10000)


    // 'on' up (and back)
    this.queue(
      new TWEEN.Tween({t:1})
        .to({t:0}, 2500)
        // .onStart(master ? function(){play('spiral')} : noop)
        .onUpdate(this.master?noop:function() {
          fill(ctx,grey(this.t < y ? 1 : 0));
        })
        .repeat(1)
        .yoyo(true)
    )

    // 'on' left (and back)
    this.queue(
      new TWEEN.Tween({t:1})
        .to({t:0}, 2500)
        // .onStart(master ? function(){play('spiral')} : noop)
        .onUpdate(this.master?noop:function() {
          fill(ctx,grey(this.t < x ? 1 : 0));
        })
        .repeat(1)
        .yoyo(true)
    )

    // 'on' right (and back)
    this.queue(
      new TWEEN.Tween({t:1})
        .to({t:0}, 2500)
        // .onStart(master ? function(){play('spiral')} : noop)
        .onUpdate(this.master?noop:function() {
          fill(ctx,grey(this.t < (1-x) ? 1 : 0));
        })
        .repeat(1)
        .yoyo(true)
    )

    this.footerHTML("rotation")

    this.blank(5000)

    // 'on' rotate
    this.queue(
      new TWEEN.Tween({a:-1})
        .to({a:(Math.PI*2)}, 7000)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate(this.master?noop:function() {
          fill(ctx,grey(a > this.a ? 0 : 1));
        })
    )


    // 'off' rotate
    this.queue(
      new TWEEN.Tween({a:0})
        .to({a:(Math.PI*2)+1}, 4000)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate(this.master?noop:function() {
          fill(ctx,grey(a > this.a ? 1 : 0));
        })
    )


    this.blank(5000)

    this.footerHTML("")
  }


  /*
    Sharing the master capabilities with devices
  */
  SyncDemo.prototype._capabilitySharing = function(){
    var ctx = this.ctx;

    this.footerHTML("sharing capabilities");

    this.blank(15000)


    // flash on and off
    for(var i=0; i < 2; i++){

      // on with beat from master
      this.queue(
        new TWEEN.Tween({t:0})
          .to({t:1}, 500)
          .onStart(this.master ? function(){play('bubbles')} : noop)
          .onUpdate(this.master?noop:function() {
            fill(ctx,grey(this.t));
          })
      )

      this.blank(1500)

      // off with a beat from the master
      this.queue(
        new TWEEN.Tween({t:1})
          .to({t:0}, 500)
          .onStart(this.master ? function(){play('bubbles')} : noop)
          .onUpdate(this.master?noop:function() {
            fill(ctx,grey(this.t));
          })
      )

      this.blank(3500)
    }


    // on to the right
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 1000)
        .onStart(this.master ? function(){play('bubbles')} : noop)
        .onUpdate(this.master?noop:function() {
          fill(ctx,grey(this.t > x ? 1 : 0));
        })
    )
    this.blank(1000)

    // and back
    this.queue(
      new TWEEN.Tween({t:1})
        .to({t:0}, 1000)
        .onStart(this.master ? function(){play('bubbles')} : noop)
        .onUpdate(this.master?noop:function() {
          fill(ctx,grey(this.t > x ? 1 : 0));
        })
    )
    this.blank(3000)


    // on to the left
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 1000)
        .onStart(this.master ? function(){play('bubbles')} : noop)
        .onUpdate(this.master?noop:function() {
          fill(ctx,grey(this.t > (1-x) ? 1 : 0));
        })
    )
    this.blank(1000)

    // and back
    this.queue(
      new TWEEN.Tween({t:1})
        .to({t:0}, 1000)
        .onStart(this.master ? function(){play('bubbles')} : noop)
        .onUpdate(this.master?noop:function() {
          fill(ctx,grey(this.t > (1-x) ? 1 : 0));
        })
    )
    this.blank(3000)



    // on to the top
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 1000)
        .onStart(this.master ? function(){play('bubbles')} : noop)
        .onUpdate(this.master?noop:function() {
          fill(ctx,grey(this.t > y ? 1 : 0));
        })
    )
    this.blank(1000)


    this.blank(4000)


    // down with fizz
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 2000)
        .onStart(this.master ? function(){play('spiral')} : noop)
        .onUpdate(this.master?noop:function() {
          fill(ctx,grey(this.t < y ? 1 : 0));
        })
    )


    this.blank(5000)
    
    this.footerHTML("")

  }

  /*
    Combining the capabilities of clients (sound)
  */

  SyncDemo.prototype._capabilityCombining = function(){
    var ctx = this.ctx,
        canvas = this.canvas,
        footer = this.footer;

    var _x    = (this.x*2)-1,
        _y    = (this.y*2)-1,
        a    = Math.atan2(_x, _y),
        a2   = a,
        d    = Math.sqrt((_x*_x)+(_y*_y));


    if(a2 < 0){
      a2   = (a2 + Math.PI*2);// 0 -> Math.PI*2
    }



    this.footerHTML('Combining capabilities <small>(turn up your volume)</small>');
    this.blank(15000)

    // fade out video
    this.queue(
      new TWEEN.Tween({a:1})
      .to({a:0}, 2000)
      .onStart(!this.master?noop:function(){
        canvas.style.opacity = 0;
        ctx.fillRect(0,0,canvas.width, canvas.height);
      })
      .onUpdate(!this.master?noop:function(){
        footer.style.opacity = this.a;
        canvas.style.opacity = 1-this.a;
      })
    )

    this.blank(5000);

    // sound moving down
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 7000)
        .onStart(this.master?noop:function(){
          setTimeout(function(){play('bubbles')}, y*3000)
        })
        .onUpdate(noop)
    )


    this.blank(4000);

    // sound moving up
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 7000)
        .onStart(this.master?noop:function(){
          setTimeout(function(){play('bubbles')}, (1-y)*3000)
        })
        .onUpdate(noop)
    )

    this.blank(5000);

    // sound moving around
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 10000)
        .onStart(this.master?noop : function(){setTimeout(function(){
          play('bubbles');
        }, (a2/(Math.PI*2))*10000)})
        .onUpdate(noop)
    )

    // faster
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 5000)
        .onStart(this.master?noop : function(){setTimeout(function(){
          play('bubbles');
        }, (a2/(Math.PI*2))*5000)})
        .onUpdate(noop)
    )

    // and faster
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 3000)
        .onStart(this.master?noop : function(){setTimeout(function(){
          play('bubbles');
        }, (a2/(Math.PI*2))*3000)})
        .onUpdate(noop)
    )

    this.blank(10000);

    // sound moving around with light
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 10000)
        .onStart(this.master?noop : function(){setTimeout(function(){
          play('bubbles');
          fill(ctx,'#fff');
        }, (a2/(Math.PI*2))*10000)})
        .onUpdate(noop)
    )


    // faster (blue)
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 5000)
        .onStart(this.master?noop : function(){setTimeout(function(){
          play('bubbles');
          fill(ctx,'#08f');
        }, (a2/(Math.PI*2))*5000)})
        .onUpdate(noop)
    )

    // across (hsv)

    // and faster (pink)
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 5000)
        .onStart(this.master?noop : function(){setTimeout(function(){
          play('bubbles');
          fill(ctx,'#f08');
        }, (a2/(Math.PI*2))*5000)})
        .onUpdate(noop)
    )


    // across (hsv)
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 7000)
        .onStart(this.master?noop:function(){
          setTimeout(function(){
            play('bubbles');
            fill(ctx,hsl_basic((a2/(Math.PI*2))*360,1,.5));
          }, x*7000)
        })
        .onUpdate(noop)
    )

    // back (white)
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 7000)
        .onStart(this.master?noop:function(){
          setTimeout(function(){
            play('bubbles');
            fill(ctx,'#fff');
          }, (1-x)*7000)
        })
        .onUpdate(noop)
    )


    this.blank(3000);

    // fizz (at same time) back to the bottom
    this.queue(
      new TWEEN.Tween({t:0})
        .to({t:1}, 2000)
        .onStart(this.master ? noop: function(){play('spiral')})
        .onUpdate(this.master?noop:function() {
          fill(ctx,grey(this.t < y ? 1 : 0));
        })
    )
  }






  SyncDemo.prototype.footerHTML = function(html){

    var footer = this.footer;

    //fade out the footer
    this.queue(
      new TWEEN.Tween({a:1})
      .to({a:0}, 1000)
      .onUpdate(!this.master?noop:function(){
        footer.style.opacity = this.a;
      })
    )

    if(html){

      this.queue(
        new TWEEN.Tween({a:0})
        .to({a:1}, 1000)
        .onStart(!this.master?noop:function(){
          footer.innerHTML = html;
        })
        .onUpdate(!this.master?noop:function(){
          footer.style.opacity = this.a;
        })
      )

    }
  }

  SyncDemo.prototype.blank = function(millis){
    this.queue(
      new TWEEN.Tween({t:0})
      .to({t:1}, millis)
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

  function noop(){}

})();

