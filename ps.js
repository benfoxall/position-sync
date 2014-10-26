
var ps = {};

// distance beween two items given a modulus
ps.distance = function(a, b, modulus){
  var x = (Math.PI*2*a)/modulus,
      y = (Math.PI*2*b)/modulus;

  var m = Math.atan2(Math.sin(x-y), Math.cos(x-y))*-1

  return (m/(Math.PI*2))*modulus;
}

ps.average = function(values, modulus){

  var angles = values.map(function(v){
    return Math.PI*2*(v/modulus);
  });

  var x = angles.map(x).reduce(sum),
      y = angles.map(y).reduce(sum),
      angle = Math.atan2( x, y ) - (Math.PI/2);

  if(angle < 0){
    angle = (angle + Math.PI*2) % (Math.PI*2);
  }

  // convert back into number
  return (angle/(Math.PI*2))*modulus

  function x(v){
    return Math.cos(v)
  }
  function y(v){
    return - Math.sin(v)
  }
  function sum(a, b){
    return a + b;
  }
}