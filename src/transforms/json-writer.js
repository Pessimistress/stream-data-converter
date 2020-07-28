import BaseTransform from './base-transform';

export default class JSONWriter extends BaseTransform {
  constructor(options) {
    super({
      id: 'jsonWriter',
      container: [],
      ...options
    });

    const [header, footer] = serializeContainer(this.options.container, this.options.path);

    this.header = header;
    this.footer = footer;
  }

  _transform(chunk, enc, cb) {
    const data = chunk.toString();
    if (this.count === 0) {
      this.push(this.header);
      this.push('\n' + data);
    } else {
      this.push(',\n' + data);
    }
    this.count++;
    cb();
  }

  _flush(cb) {
    this.push('\n' + this.footer);
    cb();
  }
}

export class GeoJSONWriter extends JSONWriter {
  constructor(options = {}) {
    options.container = {type: 'FeatureCollection', features: []};
    options.path = 'features';
    super(options);
  }
}

function serializeContainer(container, path) {
  let arr = container;
  if (path) {
    const parts = typeof path === 'string' ? path.split('.') : path;
    for (const part of parts) {
      arr = arr && arr[part];
    }
  }
  if (!Array.isArray(arr)) {
    throw new Error('Container is not an array');
  }
  arr.push('@@__content__@@');

  const str = JSON.stringify(container);
  // reset
  arr.pop();

  return str.split('"@@__content__@@"');
}
