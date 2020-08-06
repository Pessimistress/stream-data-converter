import BaseTransform from './base-transform';

// State flags
const START = 0;
const STREAMING = 1;
const END = 2;

export default class JSONReader extends BaseTransform {
  constructor(options) {
    super({
      id: 'jsonReader',
      metadata: false,
      ...options
    });

    this.bracketDepthCurly = 0;
    this.bracketDepthSquare = -1;
    this.inQuote = false;
    this.buffer = '';
    this.streamStartPos = -1;
    this.lastProcessedPos = -1;
    this.state = START;
  }

  next() {
    let buffer = this.buffer;
    let prevChar = buffer[this.lastProcessedPos - 1];
    let char;
    for (let i = this.lastProcessedPos; i < buffer.length; i++) {
      char = buffer[i];
      if (prevChar != '\\') {
        if (char === '{') {
          this.bracketDepthCurly++;
        }
        if (char === '}') {
          this.bracketDepthCurly--;
        }
        if (char === '[') {
          this.bracketDepthSquare++;
        }
        if (char === ']') {
          this.bracketDepthSquare--;
        }
        if (char === '"') {
          this.inQuote = !this.inQuote;
        }
        if (!this.inQuote && this.bracketDepthCurly === 0 && this.bracketDepthSquare == 0 && char === ',') {
          // found item of array
          const item = buffer.slice(this.streamStartPos, i);
          this.buffer = buffer.slice(0, this.streamStartPos) + buffer.slice(i + 1);
          this.lastProcessedPos = this.streamStartPos;
          return item;
        }
        if (!this.inQuote && this.bracketDepthCurly === 0 && this.bracketDepthSquare < 0) {
          // end of array
          const item = buffer.slice(this.streamStartPos, i);
          this.buffer = buffer.slice(0, this.streamStartPos) + buffer.slice(i);
          this.lastProcessedPos = this.streamStartPos + 1;
          this.state = END;
          return item;
        }
      }
      prevChar = char;
    }
    this.lastProcessedPos = buffer.length;
    return null;
  }

  processBuffer(cb) {
    if (this.state === START) {
      this.streamStartPos = this.buffer.search(/\[\s*(\[|\{)/);
      if (this.streamStartPos >= 0) {
        this.bracketDepthSquare = 0;
        this.streamStartPos++;
        this.lastProcessedPos = this.streamStartPos;
        this.state = STREAMING;
      }
    }

    let item;
    while (this.state === STREAMING && (item = this.next()) !== null) {
      this.count++;
      if (this.options.metadata) {
        this.push(wrapWithType(item, 'arrayitem'));
      } else {
        this.push(item);
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
    if (this.options.metadata) {
      this.push(wrapWithType(this.buffer, 'container'));
    }
    cb();
  }
}

function wrapWithType(jsonStr, type) {
  const result = JSON.stringify({type, data: '@@__content__@@'});
  return result.replace('"@@__content__@@"', jsonStr);
}
