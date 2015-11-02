// (c)  oblong industries

'use strict';

var chai = require('chai');
chai.use(require('chai-stats'));
var assert = chai.assert;
var plas = require('../index.js');

describe('poke()', function () {

  it('pokes a protein', function () {
    assert(plas.poke("first", {
      key: "val"
    }, "foo"), 'poke returned true')
  });

  it('peeks it back in', function (done) {
    var child = plas.peek('foo', function (p) {
      assert.deepEqual(p.descrips, ["first"], 'descrips == ["first"]')
      assert.deepEqual(p.ingests, {key: "val"}, 'ingests == {key: "val"}')
      done()
    })

    after(function() { child.kill(); });

    plas.poke("first", {
      key: "val"
    }, "foo")
  })
})
