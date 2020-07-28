import BaseTransform from './base-transform';

export default class LineWriter extends BaseTransform {
  constructor(options) {
    super({
      id: 'lineWriter',
      delimiter: '\n',
      endEmptyLine: true,
      ...options
    });
  }

  _transform(chunk, enc, cb) {
    const data = chunk.toString();
    let line = data;
    if (this.options.endEmptyLine) {
      line = data + this.options.delimiter;
    } else if (this.count > 0) {
      line = this.options.delimiter + data;
    }
    this.count++;
    this.push(line);
    cb();
  }
}
