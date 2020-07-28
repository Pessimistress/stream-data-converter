import Papa from 'papaparse';

import BaseTransform from './base-transform';

export default class CSVReader extends BaseTransform{
  // See https://www.papaparse.com/docs
  constructor(options) {
    super({
      id: 'csvReader',
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      newline: '\n',
      ...options
    });

    this.buffer = '';
    this.header = '';
  }

  next() {
    const {header, newline} = this.options;
    if (header && !this.header) {
      let firstBreak = this.buffer.indexOf(newline);
      if (firstBreak < 0) {
        return null;
      }
      firstBreak += newline.length;
      this.header = this.buffer.slice(0, firstBreak);
      this.buffer = this.buffer.slice(firstBreak);
    }
    const pos = this.buffer.lastIndexOf(newline);
    if (pos >= 0) {
      const chunk = this.header + this.buffer.slice(0, pos);
      this.buffer = this.buffer.slice(pos + newline.length);
      return chunk;
    }
    return null;
  }

  processBuffer(cb) {
    const chunk = this.next();
    if (chunk) {
      const result = Papa.parse(chunk, this.options);
      if (result.error) {
        throw result.error;
      }
      for (const item of result.data) {
        this.count++;
        this.push(JSON.stringify(item));
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
    this.buffer += this.options.newline;
    this.processBuffer(cb);
  }
}
