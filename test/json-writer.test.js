/* global test, expect */
import {Readable} from 'stream';
import {JSONWriter, GeoJSONWriter} from '../src';

test('JSONWriter', done => {
  async function * source() {
    yield '{"name":"a"}';
    yield '{"name":"b"}';
    yield '{"name":"c"}';
  }

  const writer = new JSONWriter();
  let output = '';

  Readable.from(source())
    .pipe(writer)
    .on('data', chunk => {
      output += chunk.toString();
    })
    .on('finish', () => {
      expect(output).toBe(`[
{"name":"a"},
{"name":"b"},
{"name":"c"}
]`);
      done();
    });
});

test('GeoJSONWriter', done => {
  async function * source() {
    yield JSON.stringify({type: 'Feature', geometry: {type: 'Point', coordinates: [0, 0]}});
    yield JSON.stringify({type: 'Feature', geometry: {type: 'Point', coordinates: [1, 1]}});
  }

  const writer = new GeoJSONWriter();
  let output = '';

  Readable.from(source())
    .pipe(writer)
    .on('data', chunk => {
      output += chunk.toString();
    })
    .on('finish', () => {
      expect(output).toBe(`{"type":"FeatureCollection","features":[
{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]}},
{"type":"Feature","geometry":{"type":"Point","coordinates":[1,1]}}
]}`);
      done();
    });
});
