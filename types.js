// (c) oblong industries

'use strict';

function Vect(x, y, z) {
  if (Array.isArray(x)) {
    this.x = x[0];
    this.y = x[1];
    this.z = x[2];
  } else {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

Vect.prototype.toArray = function toArray() {
  return [this.x, this.y, this.z];
};

exports.Vect = Vect;
