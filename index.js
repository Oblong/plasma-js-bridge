// (c)  oblong industries

'use strict';

/**
    Requires g-speak to be installed; peek & poke must exist on the PATH

*/

var yaml = require('js-yaml'); // also tried: yaml-js and yaml.  This works.
var spawn = require('child_process').spawn;

var SlawYamlType = new yaml.Type('tag:oblong.com,2009:slaw/protein', {
  loadKind: 'mapping'
});

var SLAW_SCHEMA = yaml.Schema.create([SlawYamlType]);

var spawn_process = function spawn_process(cmd) {
  var cmdparts = cmd.split(' ');
  if (cmdparts.length <= 0) {
    return null;
  }

  var child = spawn(cmdparts[0], cmdparts.slice(1));

  // When nodemon or other monitoring process restarts server process,
  // make sure we get rid of the child process so it doesn't become a zombie
  process.once('SIGUSR2', function() {
    child.kill();
    process.kill(process.pid, 'SIGUSR2');
  });
  return child;
};

// An attempt at a semi-generalized metabolize facility, implemented on top of the command-line **peek** utility
// - A hack; probably not performant.  But working so far.
// - Instead of a hose, we have an actual child process.
// - Calls back with one arg: p (JSON representation of a protein)
// - call child.kill to stop the peek
var peek = function peek(pool, callback) {
  var child = spawn_process('peek ' + pool);
  if (!child) return null;

  child.stdout.setEncoding('utf8');
  var buffer = '';
  child.stdout.on('data', function(data) {
    buffer += data;
    var proteins = buffer.split('\n...\n');

    // buffer keeps last piece, which is usually empty if protein ends in ...
    // if it doesn't end in ..., then it's a partial protein, and buffer
    // will keep the partial until more data arrives
    buffer = proteins[proteins.length - 1];

    // the first n-1 proteins, which are intact, can be handled
    proteins.slice(0, -1).map(function(protein) {
      process_protein(protein, callback);
    });
  });
  return child;
};

// Deposit proteins into the named pool
//  d: string or list of strings
//  i: map
// g-speak 3.19 and earlier: deposits which generate a protein above 16k fail
var poke = function poke(d, i, pool, callback) {
  if (!Array.isArray(d)) d = [d];

  try {
    var p = spawn('poke', [pool]);
    var protein_text = JSON.stringify({
      descrips: d,
      ingests: i
    });
    p.stdin.write(protein_text, 'utf8', function() {
      p.stdin.end();
      if (callback) callback();
    });
    return true;
  } catch (e) {
    console.log('Error when attempting poke: ' + e.message);
  }
  return false;
};

// Return the nth protein in the pool
var nth = function nth(pool, index, callback) {
  throw new Error('nth not implemented');

  // this would be simple, except that p-nth spews the protein
  // rather than providing it as YAML, and peek does not
  // provide an nth option
  var child = spawn_process('p-nth ' + pool + ' ' + index);
  if (!child) return null;

  child.stdout.setEncoding('utf8');
  var buffer = '';
  child.stdout.on('data', function(data) {
    buffer += data;
  });
  child.stdout.on('end', function() {
    process_protein(buffer, callback);
  });
  return child;
};

// Return the newest protein in the pool
var newest = function newest(pool, callback) {
  var child = spawn_process('peek -1 ' + pool);
  if (!child) return null;

  child.stdout.setEncoding('utf8');
  var buffer = ''
  child.stdout.on('data', function(data) {
    buffer += data;
  });
  child.stdout.on('end', function() {
    process_protein(buffer, callback);
  });
  return child;
};

// Return the oldest protein in the pool
var oldest = function oldest(pool, callback) {
  var child = spawn_process('peek --rewind --limit 1 ' + pool);
  if (!child) return null;

  child.stdout.setEncoding('utf8');
  var buffer = ''
  child.stdout.on('data', function(data) {
    buffer += data;
  });
  child.stdout.on('end', function() {
    process_protein(buffer, callback);
  });
  return child;
};

// Return the newest index in the pool
//
// Due to JavaScript's floating point number representation,
// results are undefined for indices larger than (2^53-1)
var newest_idx = function newest_idx(pool, callback) {
  var child = spawn_process('p-newest-idx ' + pool);
  if (!child) return null;

  var index = -1;
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', function(data) {
    index = parseInt(data);
    if(index === undefined)
      index = -1;
  });
  child.stdout.on('end', function() {
    callback(index);
  });
  return child;
};

// Return the oldest index in the pool
//
// Due to JavaScript's floating point number representation,
// results are undefined for indices larger than (2^53-1)
var oldest_idx = function oldest_idx(pool, callback) {
  var child = spawn_process('p-oldest-idx ' + pool);
  if (!child) return null;

  var index = -1;
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', function(data) {
    index = parseInt(data);
    if(index === undefined)
      index = -1;
  });
  child.stdout.on('end', function() {
    callback(index);
  });
  return child;
};

// Parse a protein
//
// Returns a bool to indicate whether parsing was successful
var process_protein = function process_protein(protein, callback) {
  var success = false;
  try {
    yaml.safeLoadAll(protein, function(protein) {
      if (protein.descrips && protein.ingests && protein.descrips.length > 0) {
        try {
          callback(protein);
        } catch (e) {
          console.log(e);
        }
        success = true;
      } else {
        console.log('ERROR: protein arrived without descrips or ingests: ');
        console.log(JSON.stringify(protein));
      }
    }, { schema: SLAW_SCHEMA });
  } catch (e) {
    console.log('Yaml error handling protein: ' + JSON.stringify(e));
  }

  if (!success) {
    callback(null);
  }

  return success;
}

exports.poke = poke;
exports.peek = peek;
//exports.nth = nth;
exports.newest = newest;
exports.oldest = oldest;
exports.oldestIndex = oldest_idx;
exports.newestIndex = newest_idx;
