/* global test, expect */
import {Readable} from 'stream';
import {CSVWriter} from '../src';

test('CSVWriter', done => {
  async function * source() {
    yield JSON.stringify({a: 0, b: 1});
    yield JSON.stringify({b: 0, a: 1});
    yield JSON.stringify({a: 1, b: 2});
  }

  const writer = new CSVWriter();
  let output = '';

  Readable.from(source())
    .pipe(writer)
    .on('data', chunk => {
      output += chunk.toString();
    })
    .on('finish', () => {
      expect(output).toBe('a,b\r\n0,1\r\n1,0\r\n1,2');
      done();
    });
});
