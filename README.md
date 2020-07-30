This library provides tools for stream-processing large, "iterable" data files (e.g. text, CSV, DSV, JSONP, array-like JSON, GeoJSON, Shapefile) that cannot be loaded into memory all at once.

It is best for tasks that can be performed independently on each iteration, such as:

- Inspect data and generate column-wise statistics
- Output a subset of the input data based on a filter
- Convert input data to another format
- Download and save data from remote API in batches

## Install

```bash
npm install stream-data-converter
```

## Usage

The core exports implement Node.js' [stream.Transform class](https://nodejs.org/api/stream.html#stream_class_stream_transform).

```js
const {JSONReader, Transform, CSVWriter} = require('stream-data-converter');

/*
 * input.geojson
   {"type": "FeatureCollection", "features: [
     {"type":"Feature","properties":{"COUNT":1,"DATESTR":"2020-01-01 16:37:03Z"},"geometry":{"type":"Point","coordinates":[-122.45,37.78]}},
     ...
   ]}

 * output.tsv
   count  timestamp longitude latitude
   1  1577896623  -122.45 37.78
   ...
 */

fs.createReadStream('path/to/input.geojson')
  .pipe(new JSONReader())
  .pipe(new Transform(processFeature))
  .pipe(new CSVWriter({delimiter: '\t'}))
  .pipe(fs.createWriteStream('path/to/output.tsv'));

function processFeature(feature, index) {
  if (feature.properties.COUNT === 0) {
    return null; // discard
  }
  return {
    count: feature.properties.COUNT,
    timestamp: Date(feature.properties.DATESTR) / 1000,
    longitude: feature.geometry.coordinates[0],
    latitude: feature.geometry.coordinates[1]
  };
}
```

## API Reference

### Readers

The reader classes take a text-based input and ouput a semantically parsed iterable down the stream.

#### LineReader

Outputs an iterable where each item is a line of text.

```js
const {LineReader} = require('stream-data-converter');
const reader = new LineReader(options);
```

Options

- `id` (String, optional): identifier of this reader instance.
- `delimiter` (String, optional): delimiter (line break) of the input. Default `'\n'`.
- `skipEmptyLines` (Boolean, optional): if `true`, empty lines are omitted. Default `true`.

#### CSVReader

Parses csv/dsv formatted input and outputs an iterable where each item is a JSON object describing a row.

```js
const {CSVReader} = require('stream-data-converter');
const reader = new CSVReader(options);
```

Options

- `id` (String, optional): identifier of this reader instance.
- All options that are supported by [Papaparse.parse](https://www.papaparse.com/docs#config). The following defaults are used instead of the original default config:
  + `header`: `true`
  + `dynamicTyping`: `true`
  + `skipEmptyLines`: `true`
  + `newline`: `'\n'`

#### JSONReader

Parses JSON input and outputs an iterable where each item is an element in the first object array (array of objects, in the form of `[{}]`).

If the input JSON is an array, then each iteration returns an item in this array.

If the input JSON is a nested object, then the reader looks for the first object array that it encounters, and returns its element one for each iteration. For example, a typical GeoJSON is in the shape of `{type: 'FeatureCollection', features: [...]}`, and this reader will iterate through each feature in the `features` array.


```js
const {JSONReader} = require('stream-data-converter');
const reader = new JSONReader(options);
```

Options:

- `id` (String, optional): identifier of this reader instance.
- `metadata` (Boolean, optional): If `false` (default), just the array element itself is returned. If `true`, the element is wrapped an object in the shape of `{type, data}`:
  + `type: 'arrayitem'`: `data` is an element of the object array
  + `type: 'container'`: `data` is the outer JSON object, with the iterated object array empty.


### Transform

Transforms an iterable from upstream to another iterable. Usually consumes the output of a [Reader](#Readers).

For each incoming iteration, `Transform` calls a callback function. This callback is expected to return one of the following:

- `null` or `undefined`: ignore this item
- Object or string: push a single item to the output iterable
- Array: push multiple items to the output iterable

```js
const {Transform} = require('stream-data-converter');
const transform = new Transform(options);
```

Options:

- If `options` is a function, it is used as the iteration callback.
- If `options` is an object, it can contain the following fields:
  + `transform` (Function): the iteration callback.
  + `id` (String, optional): identifier of this transform instance.
  + `inputType` (String, optional): `json` or `text`. Force the incoming item to be formatted. Default `'auto'`.
  + `maxConcurrency` (Number, optional): if `transform` is an async function, use this option to limit how many can be running concurrently.
  + `minTime` (Number, optional): if `transform` is an async function, use this option to throttle the calls. Default `0` (no throttling).


### Writers

Writers consume an iterable and output a formatted text stream that can be written to a file.

#### LineWriter

Writes each item to a line of text.

```js
const {LineWriter} = require('stream-data-converter');
const writer = new LineWriter(options);
```

Options:

- `id` (String, optional): identifier of this writer instance.
- `delimiter` (String, optional): delimiter (line break) of the output. Default `\n`.
- `endEmptyLine` (Boolean, optional): if `true`, always append an empty line at the end. Default `true`.

#### CSVWriter

Writes each item to a row in csv/dsv formatted text.

```js
const {CSVWriter} = require('stream-data-converter');
const writer = new CSVWriter(options);
```

Options:

- `id` (String, optional): identifier of this writer instance.
- All options that are supported by [Papaparse.unparse](https://www.papaparse.com/docs#json-to-csv). The following defaults are used instead of the original default config:
  + `newline`: `'\n'`
- `batchSize`: The number of items to encode in a batch. Default `100`.

#### JSONWriter

Writes each item to a array elemnt in JSON formatted text.

```js
const {JSONWriter} = require('stream-data-converter');
const writer = new JSONWriter(options);
```

Options:

- `id` (String, optional): identifier of this writer instance.
- `container` (Object, optional): the container object. Default `[]`.
- `path` (String, optional): path to the parent array in the container object, joined by `.`. Default `null`.

#### GeoJSONWriter

Writes each item as a feature in GeoJSON `FeatureCollection`.

```js
const {GeoJSONWriter} = require('stream-data-converter');
const writer = new GeoJSONWriter();
// This is equivalent of
const writer = new JSONWriter({
  container: {type: 'FeatureCollection', features: []},
  path: 'features'
});
```

### Helper Utilities

#### logProgress

Logs streaming progress to the console. Useful when the process takes a long time to run.

```js

const {JSONReader, Transform, GeoJSONWriter, logProgress} = require('stream-data-converter');

const reader = new JSONReader();
// Only keep features in California
const transform = new Transform(f => f.properties.state === 'CA' ? f : null);
const writer = new GeoJSONWriter();

logProgress(reader, transform, writer);

fs.createReadStream('path/to/input.geojson')
  .pipe(reader)
  .pipe(transform)
  .pipe(writer)
  .pipe(fs.createWriteStream('path/to/output.geojson'));

// The console will print a growing counter that looks like this:
// jsonReader: 9999 | transform: 9999 | jsonWriter: 7213
```
