/* global test, expect, __dirname */
import fs from 'fs';
import path from 'path';
import {JSONReader, Transform} from '../src';

test('Transform', done => {
  const jsonReader = new JSONReader();
  const processor = new Transform(feature => {
    expect(feature.geometry).toBeDefined();
    return feature.properties.name;
  });
  fs.createReadStream(path.resolve(__dirname, './data/states.geojson'), {encoding: 'utf8'})
    .pipe(jsonReader)
    .pipe(processor)
    .on('data', name => {
      // console.log(name.toString());
      expect(name.length).toBeGreaterThan(0);
    })
    .on('finish', () => {
      expect(processor.count).toBe(51);
      done();
    });
});

test('Transform#async', done => {
  const jsonReader = new JSONReader();
  const processor = new Transform({
    maxConcurrency: 10,
    transform: f => new Promise(resolve => {
      setTimeout(() => resolve(f.properties.name), 0);
    })
  });
  fs.createReadStream(path.resolve(__dirname, './data/states.geojson'), {encoding: 'utf8'})
    .pipe(jsonReader)
    .pipe(processor)
    .on('data', name => {
      // console.log(name.toString());
      expect(name.length).toBeGreaterThan(0);
    })
    .on('finish', () => {
      expect(processor.count).toBe(51);
      done();
    });
});
