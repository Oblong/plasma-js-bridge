# plasma-js-bridge

Uses YAML to bridge between node.js and Oblong plasma peek/poke


## API documentation

### `poke(descrips, ingests, pool, callback)`

Deposits a protein into the named pool.  `descrips` is a string or array of strings; `ingests` is an object.


### `peek(pool, callback)`

Continues to watch the named pool and callback once for each protein that arrives there.  Returns a child object; call child.kill() to stop the peek


## Testing

Do `npm test`.

## License

This library is released under an MIT license.
