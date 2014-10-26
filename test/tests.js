describe('distance', function(){

  it('works for simple cases', function(){

    equalish(ps.distance(4, 5, 10), 1)
    equalish(ps.distance(5, 4, 10), -1)

  })

  it('works for modulus cases', function(){

    equalish(ps.distance(5, 15, 10), 0)
    equalish(ps.distance(15, 5, 10), 0)

  })

  it('works for boundary cases', function(){

    equalish(ps.distance(9, 1, 10), 2)
    equalish(ps.distance(1, 9, 10), -2)
    equalish(ps.distance(8, 2, 10), 4)

  })

})


describe('average', function(){

  it('works for simple cases', function(){

    equalish(ps.average([4, 6, 4, 6], 10), 5)
    equalish(ps.average([5, 5, 4, 4, 6, 6], 10), 5)

  })


  it('works for modulus cases', function(){

    equalish(ps.average([14, 106, 4, 16], 10), 5)
    equalish(ps.average([5, 105, 4, 14, 6, 6], 10), 5)

  })


  it('works for boundary cases', function(){

    equalish(ps.average([9,1], 10), 0)
    equalish(ps.average([9,9,3,3], 10), 1)

  })


})


function equalish(a, b){
  expect(a).to.greaterThan(b-0.1)
  expect(a).to.lessThan(b+0.1)
}