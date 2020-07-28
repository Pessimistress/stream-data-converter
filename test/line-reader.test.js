/* global test, expect, __dirname */
import fs from 'fs';
import path from 'path';
import {LineReader} from '../src';

test('LineReader', done => {
  const lineReader = new LineReader();
  fs.createReadStream(path.resolve(__dirname, './data/md.csv'), {encoding: 'utf8'})
    .pipe(lineReader)
    .on('data', line => {
      expect(line.length).toBeGreaterThan(0);
    })
    .on('finish', () => {
      expect(lineReader.count).toBe(5000);
      done();
    });
});
