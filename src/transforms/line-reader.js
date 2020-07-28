import BaseTransform from './base-transform';

export default class LineReader extends BaseTransform {
  constructor(options) {
    super({
      id: 'lineReader',
      delimiter: '\n',
      skipEmptyLines: true,
      ...options
    });

    this.buffer = '';
  }

  next() {
    let buffer = this.buffer;
    const {delimiter} = this.options;
    const pos = buffer.search(delimiter);
    let line;
    if (pos >= 0) {
      line = buffer.slice(0, pos);
      this.buffer = buffer.slice(pos + delimiter.length);
      return line;
    }
    return null;
  }

  processBuffer(cb) {
    let line;
    const {skipEmptyLines} = this.options;
    while ((line = this.next()) !== null) {
      if (line.length > 0 || !skipEmptyLines) {
        this.count++;
        this.push(line);
      }
    }
    cb();
  }

  _transform(chunk, enc, cb) {
    const data = chunk.toString();
    this.buffer += data;
    this.processBuffer(cb);
  }

  _flush(cb) {
    this.buffer += this.options.delimiter;
    this.processBuffer(cb);
  }
}
