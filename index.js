// (c)  oblong industries

'use strict';

/**
    Requires g-speak to be installed; peek & poke must exist on the PATH

*/

var yaml = require('js-yaml'); // also tried: yaml-js and yaml.  This works.
var spawn = require('child_process').spawn;
var _ = require('underscore');

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
      try {

        yaml.safeLoadAll(protein, function(p) {
          if (p.descrips && p.ingests && p.descrips.length > 0) {
            try {
              callback(p);
            } catch (e) {
              console.log(e);
            }
          } else {
            console.log('ERROR: protein arrived without descrips or ingests: ');
            console.log(JSON.stringify(p));
          }
        });
      } catch (e) {
        console.log('Yaml error handling protein: ' + JSON.stringify(e));
      }
    });
  });
  return child;
};

// Deposit proteins into the named pool
//  d: string or list of strings
//  i: map
// g-speak 3.19 and earlier: deposits which generate a protein above 16k fail
var poke = function poke(d, i, pool, callback) {
  if (!_.isArray(d)) d = [d];

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

exports.poke = poke;
exports.peek = peek;