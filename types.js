// (c) oblong industries

'use strict';

function Vect(x, y, z, w) {
  if (Array.isArray(x)) {
    this.x = x[0];
    this.y = x[1];
    this.z = x[2];
    this.w = x[3];
  } else {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
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

exports.Vect = Vect;
