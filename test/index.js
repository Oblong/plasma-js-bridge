// (c)  oblong industries

'use strict';

let chai = require('chai');
chai.use(require('chai-stats'));
let assert = chai.assert;
let plas = require('../index.js');

describe('poke()', () => {

  it('pokes a protein', () => {
    assert(plas.poke("first", {
      key: "val"
    }, "foo"), 'poke returned true')
  });

  it('peeks it back in', () => {
    plas.peek('foo', (p) => {
      assert(p.descrips == ["first"], 'descrips == ["first"]')
      assert(p.ingests == {key: "val"}, 'ingests == {key: "val"}')
      done()
    })

  })
})