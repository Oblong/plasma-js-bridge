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
    spawn('p-create', [pool]).on('exit', function () {
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

describe('custom types', function () {
  // It would be nice to avoid the pool deposit/metabolize rigmarole - maybe
  // splitting out a private module for the YAML encoding/decoding and testing
  // that would be a good idae.
  var Vect = plas.types.Vect;
  var v2 = new Vect([0.0, -1.0]);
  var v3 = new Vect([0.0, -1.0, 2.0]);
  var v4 = new Vect([0.0, -1.0, 2.0, 3.0]);

  var VECT_POOL = 'pjsb-vect';

  it('after poking an n-Vect, peeks back an n-Vect', function (done) {
    empty_pool(VECT_POOL)
      .then (function () {
        return pokeAsync(['vect-test'], {v2: v2, v3: v3, v4: v4}, VECT_POOL);
      })
      .then(function () {
        plas.oldest(VECT_POOL, function (protein) {
          assert.deepEqual(protein.descrips, ['vect-test']);

          assert.instanceOf(protein.ingests['v2'], Vect);
          assert.deepEqual(protein.ingests['v2'], v2);

          assert.instanceOf(protein.ingests['v3'], Vect);
          assert.deepEqual(protein.ingests['v3'], v3);

          assert.instanceOf(protein.ingests['v4'], Vect);
          assert.deepEqual(protein.ingests['v4'], v4);
          done();
        });
      });
  })

  it('array-style accessors are provided for backwards compat.', function (done) {
    empty_pool(VECT_POOL)
      .then (function () {
        return pokeAsync(['vect-test'], {v2: v2, v3: v3, v4: v4}, VECT_POOL);
      })
      .then(function () {
        plas.oldest(VECT_POOL, function (protein) {
          assert.deepEqual(protein.descrips, ['vect-test']);

          assert.instanceOf(protein.ingests['v2'], Vect);
          assert.equal(protein.ingests['v2'][0], v2.x);
          assert.equal(protein.ingests['v2'][1], v2.y);

          assert.instanceOf(protein.ingests['v3'], Vect);
          assert.equal(protein.ingests['v3'][0], v3.x);
          assert.equal(protein.ingests['v3'][1], v3.y);
          assert.equal(protein.ingests['v3'][2], v3.z);

          assert.instanceOf(protein.ingests['v4'], Vect);
          assert.equal(protein.ingests['v4'][0], v4.x);
          assert.equal(protein.ingests['v4'][1], v4.y);
          assert.equal(protein.ingests['v4'][2], v4.z);
          assert.equal(protein.ingests['v4'][3], v4.w);
          done();
        });
      });
  })
});
