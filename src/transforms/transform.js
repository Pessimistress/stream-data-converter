import Bottleneck from 'bottleneck';

import BaseTransform from './base-transform';

export default class CustomTransform extends BaseTransform {
  constructor(options) {
    if (typeof options === 'function') {
      options = { transform: options };
    }
    if (!options || !options.transform) {
      throw new Error('Must specify transform callback');
    }
    super({
      id: 'transform',
      inputType: 'auto',
      ...options
    });

    const {
      maxConcurrency = 0,
      minTime = 0
    } = options;

    this.limiter = maxConcurrency || minTime
      ? new Bottleneck(maxConcurrency, minTime)
      : null;
    this.pendingCount = 0;
  }

  yield(item, recursive = true) {
    if (item === null || item === undefined) {
      // ignore;
    } else if (recursive && Array.isArray(item)) {
      for (const d of item) {
        this.yield(d, false);
      }
    } else if (typeof item === 'object') {
      this.push(JSON.stringify(item));
    } else {
      this.push(String(item));
    }
  }

  resolveAll(cb) {
    if (this.count === this.pendingCount) {
      cb();
    } else {
      setTimeout(() => this.resolveAll(cb), 200);
    }
  }

  _transform(chunk, enc, cb) {
    let data = chunk.toString();
    let type = this.options.inputType;

    if (type === 'auto') {
      type = isJSON(data) ? 'json' : 'text';
    }
    if (type === 'json') {
      data = JSON.parse(data);
    }
    const result = this.limiter
      ? this.limiter.schedule(() => this.options.transform(data, this.pendingCount++))
      : this.options.transform(data, this.pendingCount++);

    if (result instanceof Promise) {
      result.then(r0 => {
        this.count++;
        this.yield(r0);
        cb();
      }).catch(err => {
        cb(err);
      });
    } else {
      this.count++;
      this.yield(result);
      cb();
    }
  }

  _flush(cb) {
    this.resolveAll(cb);
  }
}

// infer the type of an incoming chunk
function isJSON(str) {
  str = str.trim();
  const firstChar = str[0];
  const lastChar = str[str.length - 1];
  return (firstChar === '[' && lastChar === ']') || (firstChar === '{' && lastChar === '}');
}
