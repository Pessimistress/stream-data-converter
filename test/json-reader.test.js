/* global test, expect, __dirname */
import fs from 'fs';
import path from 'path';
import {JSONReader} from '../src';

test('JSONReader', done => {
  const jsonReader = new JSONReader();
  fs.createReadStream(path.resolve(__dirname, './data/states.geojson'), {encoding: 'utf8'})
    .pipe(jsonReader)
    .on('data', item => {
      const d = JSON.parse(item);
      expect(d.geometry).toBeDefined();
    })
    .on('finish', () => {
      expect(jsonReader.count).toBe(51);
      done();
    });
});

test('JSONReader#metadata', done => {
  const jsonReader = new JSONReader({metadata: true});
  fs.createReadStream(path.resolve(__dirname, './data/states.geojson'), {encoding: 'utf8'})
    .pipe(jsonReader)
    .on('data', item => {
      const d = JSON.parse(item);
      if (d.type === 'arrayitem') {
        expect(d.data.geometry).toBeDefined();
      } else {
        expect(d.data).toEqual({type: 'FeatureCollection', features: []});
      }
    })
    .on('finish', () => {
      expect(jsonReader.count).toBe(51);
      done();
    });
});
