import Papa from 'papaparse';

import BaseTransform from './base-transform';

export default class CSVWriter extends BaseTransform {
  // See https://www.papaparse.com/docs
  constructor(options = {}) {
    super({
      id: 'csvWriter',
      header: true,
      batchSize: 100,
      ...options
    });

    this.fields = options.columns;
    this.buffer = [];
  }

  serialize() {
    if (this.buffer.length === 0) {
      return;
    }
    const result = Papa.unparse(this.fields ? {
      fields: this.fields,
      data: this.buffer.map(row => this.fields.map(col => row[col]))
    } : this.buffer, {
      ...this.options,
      header: this.options.header && this.count === 0
    });
    this.count += this.buffer.length;
    this.push(result);
  }

  _transform(chunk, enc, cb) {
    const data = JSON.parse(chunk);
    if (!this.fields && this.options.header) {
      this.fields = Object.keys(data);
    }

    this.buffer.push(data);

    if (this.buffer.length > this.options.batchSize) {
      this.serialize();
    }
    cb();
  }

  _flush(cb) {
    this.serialize();
    cb;
  }
}
