/* global test, expect */
import {Readable} from 'stream';
import {LineWriter} from '../src';

test('LineWriter', done => {
  async function * source() {
    yield 'a';
    yield 'b';
    yield 'c';
  }

  const lineWriter = new LineWriter();
  let output = '';

  Readable.from(source())
    .pipe(lineWriter)
    .on('data', chunk => {
      output += chunk.toString();
    })
    .on('finish', () => {
      expect(output).toBe('a\nb\nc\n');
      done();
    });
});
