import {Transform} from 'stream';

export default class BaseTransform extends Transform {
  constructor(options = {}) {
    super();

    this.id = options.id;
    this.options = options;
    this._count = 0;
  }

  get count() {
    return this._count;
  }

  set count(value) {
    this._count = value;
    this.emit('counter', value);
  }
}
