/* global test, expect, __dirname */
import fs from 'fs';
import path from 'path';
import {CSVReader} from '../src';

test('CSVReader', done => {
  const csvReader = new CSVReader();
  fs.createReadStream(path.resolve(__dirname, './data/md.csv'), {encoding: 'utf8'})
    .pipe(csvReader)
    .on('data', item => {
      item = JSON.parse(item);
      expect(item.tick).toBeTruthy();
    })
    .on('finish', () => {
      expect(csvReader.count).toBe(4999);
      done();
    });
});
