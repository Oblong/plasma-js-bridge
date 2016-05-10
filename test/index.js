// (c)  oblong industries

'use strict';

var chai = require('chai');
chai.use(require('chai-stats'));
var assert = chai.assert;
var plas = require('../index.js');
var spawn = require('child_process').spawn;

var empty_pool = function(pool) {
  if (!pool || pool === '') return;
  spawn('p-stop', [pool]);
  spawn('p-create', [pool]);
}

describe('poke', function () {

  before (function() {
    empty_pool('foo');
  });

  it('pokes a protein', function () {
    assert(plas.poke("first", {
      key: "val"
    }, "foo"), 'poke returned true')
  });

})

describe('peek', function () {

  before (function(done) {
    empty_pool('foo');
    empty_pool('bar');

    assert(plas.poke("first", {
      key: 1
    }, "foo"), 'poke returned true');

    assert(plas.poke("second", {
      key: 2
    }, "foo"), 'poke returned true');

    assert(plas.poke("third", {
      key: 3
    }, "foo"), 'poke returned true');

    setTimeout(done, 10);
  });

  it('peeks an incoming protein', function (done) {
    var child = plas.peek('bar', function (p) {
      assert.deepEqual(p.descrips, ["first"], 'descrips == ["first"]')
      assert.deepEqual(p.ingests, {key: "val"}, 'ingests == {key: "val"}')
      done()
    })

    after(function() { child.kill(); });

    plas.poke("first", {
      key: "val"
    }, "bar")
  })

  it('peeks the oldest protein', function (done) {
    var child = plas.oldest('foo', function (p) {
      assert.deepEqual(p.descrips, ["first"], 'descrips == ["first"]');
      assert.deepEqual(p.ingests, {key: 1}, 'ingests == {key: 1}');
      done();
    });

    after(function() { child.kill(); });
  });

  it('peeks the newest protein', function (done) {
    var child = plas.newest('foo', function (p) {
      assert.deepEqual(p.descrips, ["third"], 'descrips == ["third"]');
      assert.deepEqual(p.ingests, {key: 3}, 'ingests == {key: 3}');
      done();
    });

    after(function() { child.kill(); });
  });

  it.skip('peeks the nth protein', function (done) {
    var child = plas.nth('foo', 1, function (p) {
      assert.deepEqual(p.descrips, ["second"], 'descrips == ["second"]');
      assert.deepEqual(p.ingests, {key: 2}, 'ingests == {key: 2}');
      done();
    });

    after(function() { child.kill(); });
  });

});

describe('indices', function () {

  before (function(done) {
    empty_pool('baz');

    assert(plas.poke("first", {
      key: 1
    }, "baz"), 'poke returned true');

    assert(plas.poke("second", {
      key: 2
    }, "baz"), 'poke returned true');

    assert(plas.poke("third", {
      key: 3
    }, "baz"), 'poke returned true');

    setTimeout(done, 10);
  });

  it('identifies newest index', function (done) {
    var child = plas.newestIndex('baz', function (i) {
      assert.equal(i, 2);
      done();
    });

    after(function() { child.kill(); });
  });

  it('identifies oldest index', function (done) {
    var child = plas.oldestIndex('baz', function (i) {
      assert.equal(i, 0);
      done();
    });

    after(function() { child.kill(); });
  });

});