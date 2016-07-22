// (c)  oblong industries

'use strict';

var chai = require('chai');
chai.use(require('chai-stats'));
var assert = chai.assert;
var plas = require('..');
var spawn = require('child_process').spawn;
var promisify = require('bluebird').Promise.promisify;

var empty_pool = promisify(function(pool, done) {
  if (!pool || pool === '') return;
  spawn('p-stop', [pool]).on('exit', function () {
    console.log('p-stop done');
    spawn('p-create', [pool]).on('exit', function () {
      console.log('p-create done');
      done();
    });
  });
});

// Need this to poke proteins sequentially.
var pokeAsync = promisify(plas.poke);

describe('poke', function () {
  var POKE_POOL = 'pjsb-poke';

  before (function(done) {
    empty_pool(POKE_POOL).then(done);
  });

  it('pokes a protein', function () {
    assert(plas.poke("first", {
      key: "val"
    }, POKE_POOL), 'poke returned true')
  });

});

describe('peek', function () {
  var HIST_POOL = 'pjsb-history';
  var LIVE_POOL = 'pjsb-live';
  var NOTA_POOL = 'pjsb-fubar';

  before (function(done) {
    empty_pool(HIST_POOL)
      .then(function () {
        return empty_pool(LIVE_POOL);
      })
      .then(function () {
        return pokeAsync('first', {key: 1}, HIST_POOL)
      })
      .then(function () {
        return pokeAsync('second', {key: 2}, HIST_POOL);
      })
      .then(function () {
        return pokeAsync('third', {key: 3}, HIST_POOL);
      })
      .then(done);
  });

  it('peeks an incoming protein', function (done) {
    var child = plas.peek(LIVE_POOL, function (p) {
      assert.deepEqual(p.descrips, ['incoming'], 'descrips == ["incoming"]')
      assert.deepEqual(p.ingests, {key: "val"}, 'ingests == {key: "val"}')
      done();
    })

    after(function() { child.kill(); });

    plas.poke(['incoming'], {
      key: 'val'
    }, LIVE_POOL);
  });

  it('peeks the oldest protein', function (done) {
    var child = plas.oldest(HIST_POOL, function (p) {
      assert.deepEqual(p.descrips, ["first"], 'descrips == ["first"]');
      assert.deepEqual(p.ingests, {key: 1}, 'ingests == {key: 1}');
      done();
    });

    after(function() { child.kill(); });
  });

  it('peeks the newest protein', function (done) {
    var child = plas.newest(HIST_POOL, function (p) {
      assert.deepEqual(p.descrips, ["third"], 'descrips == ["third"]');
      assert.deepEqual(p.ingests, {key: 3}, 'ingests == {key: 3}');
      done();
    });

    after(function() { child.kill(); });
  });

  it.skip('peeks the nth protein', function (done) {
    var child = plas.nth(HIST_POOL, 1, function (p) {
      assert.deepEqual(p.descrips, ["second"], 'descrips == ["second"]');
      assert.deepEqual(p.ingests, {key: 2}, 'ingests == {key: 2}');
      done();
    });

    after(function() { child.kill(); });
  });

  it('returns null for oldest when pool does not exist', function (done) {
    var child = plas.oldest(NOTA_POOL, function (p) {
      assert.equal(p, null);
      done();
    });

    after(function() { child.kill(); });
  });

  it('returns null for newest when pool does not exist', function (done) {
    var child = plas.newest(NOTA_POOL, function (p) {
      assert.equal(p, null);
      done();
    });

    after(function() { child.kill(); });
  });

});

// The 'indices' tests are broken for reasons I don't understand -- it appears
// that the stdout of the p-oldest-idx and p-newest-idx processes are closing
// before any data (i.e. "the index") is written to them.
describe.skip('indices', function () {
  var IDX_POOL = 'pjsb-index';
  var NOTA_POOL = 'pjsb-fubar';

  before (function(done) {
    empty_pool(IDX_POOL)
      .then(function () {
        return pokeAsync('first', {key: 1}, IDX_POOL)
      })
      .then(function () {
        return pokeAsync('second', {key: 2}, IDX_POOL);
      })
      .then(function () {
        return pokeAsync('third', {key: 3}, IDX_POOL);
      })
      .then(done);
  });

  it('identifies newest index', function (done) {
    var child = plas.newestIndex(IDX_POOL, function (i) {
      assert.equal(i, 2);
      done();
    });

    after(function() { child.kill(); });
  });

  it('identifies oldest index', function (done) {
    var child = plas.oldestIndex(IDX_POOL, function (i) {
      assert.equal(i, 0);
      done();
    });

    after(function() { child.kill(); });
  });

  it('returns -1 for newestIndex when pool does not exist', function (done) {
    var child = plas.newestIndex(NOTA_POOL, function (i) {
      assert.equal(i, -1);
      done();
    });

    after(function() { child.kill(); });
  });

  it('returns -1 for oldestIndex when pool does not exist', function (done) {
    var child = plas.oldestIndex(NOTA_POOL, function (i) {
      assert.equal(i, -1);
      done();
    });

    after(function() { child.kill(); });
  });
});
