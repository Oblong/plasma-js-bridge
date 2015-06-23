// (c)  oblong industries

'use strict';

/**
    Requires g-speak to be installed; peek & poke must exist on the PATH

*/


let yaml = require('js-yaml')     // also tried: yaml-js and yaml.  This works.
let spawn = require('child_process').spawn
let _ = require('underscore')

var spawn_process = (cmd) => {
  let cmdparts = cmd.split(' ')
  if (cmdparts.length <= 0) {
    return null
  }

  let child = spawn(cmdparts[0], cmdparts.slice(1))

  // When nodemon or other monitoring process restarts server process,
  // make sure we get rid of the child process so it doesn't become a zombie
  process.once('SIGUSR2', () => {
    child.kill()
    process.kill(process.pid, 'SIGUSR2')
  })
  return child
}

// An attempt at a semi-generalized metabolize facility, implemented on top of the command-line **peek** utility
// - A hack; probably not performant.  But working so far.
// - Instead of a hose, we have an actual child process.
// - Calls back with one arg: p (JSON representation of a protein)
// - call child.kill to stop the peek
var peek = (pool, callback) => {
  let child = spawn_process('peek ' + pool)
  if (! child)
    return null
  
  child.stdout.setEncoding('utf8')
  let buffer = ''
  child.stdout.on('data', (data) => {
    buffer += data
    let proteins = buffer.split("\n...\n")

    // buffer keeps last piece, which is usually empty if protein ends in ...
    // if it doesn't end in ..., then it's a partial protein, and buffer
    // will keep the partial until more data arrives
    buffer = proteins[proteins.length - 1]

    // the first n-1 proteins, which are intact, can be handled
    proteins.slice(0, -1).map(
      (protein) => {
        try {

          yaml.safeLoadAll(protein, (p) => {
            if (p.descrips && p.ingests && p.descrips.length > 0) {
              try {
                callback(p)
              } catch (e) {
                console.log(e)
              }
            } else {
              console.log("ERROR: protein arrived without descrips or ingests: ")
              console.log(JSON.stringify(p))
            }
          })

        } catch (e) {
          console.log("Yaml error handling protein: " + JSON.stringify(e))
        }
      })
  })
  return child
}

// Deposit proteins into the named pool
//  d: string or list of strings
//  i: map
var poke = (d, i, pool, callback) => {
  if (!_.isArray(d))
    d = [d]

  try {
    console.log(">> poke: " + JSON.stringify(d) + "  ::  " + JSON.stringify(i))
    let ingestsAsYaml = yaml.safeDump({
      descrips: d,
      ingests: i
    })
    let p = spawn('poke', [pool])
    p.stdin.write(ingestsAsYaml)
    p.on('exit', (code) => {
      if (callback)
        callback()
      p.stdin.end()
    })
    return true
  } catch (e) {
    console.log("Error when attempting poke: " + JSON.stringify(e))
  }
  return false
}

exports.poke = poke
exports.peek = peek