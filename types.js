// (c) oblong industries

'use strict';

// Constructs a 2-, 3-, or 4- vect from the specified components, or an
// array of the corresponding length. Read-only array-style accessors
// (e.g. v[0]) are provided for backwards compatibility.
function Vect(x, y, z, w) {
  if (Array.isArray(x)) {
    this.x = x[0];
    this.y = x[1];
    this.z = x[2];
    this.w = x[3];
    this[0] = x[0];
    this[1] = x[1];
    this[2] = x[2];
    this[3] = x[3];
  } else {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    this[0] = x;
    this[1] = y;
    this[2] = z;
    this[3] = w;
  }
}

Vect.prototype.toArray = function toArray() {
  if (this.w !== undefined)
    return [this.x, this.y, this.z, this.w];
  if (this.z !== undefined)
    return [this.x, this.y, this.z];
  else
    return [this.x, this.y];
};

function SlawArray(arr) {
  this._arr = arr || [];
}

SlawArray.prototype.toArray = function toArray() {
  return this._arr.slice();
}

exports.Vect = Vect;
exports.Array = SlawArray;
