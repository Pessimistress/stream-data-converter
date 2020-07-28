/*
 * Usage:
   node stats.js [file]
   node stats.js [file] [path0] [path1] ...
 */
const fs = require('fs');
const clc = require('cli-color');
const {JSONReader, CSVReader, logProgress, Transform} = require('../src');

const MAX_STRING_LENGTH = 32;
const MAX_UNIQUE_VALUES = 25;
const inputFile = process.argv[2];
const stats = {};
const properties = [];

if (process.argv.length > 3) {
  for (let i = 3; i < process.argv.length; i++) {
    properties.push(getAccessor(process.argv[i]));
  }
} else if (inputFile.endsWith('.geojson')) {
  properties[0] = {recursive: true, accessor: f => f.properties};
} else {
  properties[0] = {recursive: true, accessor: d => d};
}

const reader = inputFile.endsWith('.csv') ? new CSVReader() : new JSONReader();
const transform = new Transform(item => {
  for (const {name, recursive, accessor} of properties) {
    const obj = accessor(item);
    if (obj && recursive) {
      for (const key in obj) {
        addToStats(key, obj[key]);
      }
    } else if (name) {
      addToStats(name, obj);
    }
  }
});

logProgress(reader, transform);

fs.createReadStream(inputFile, 'utf-8')
  .pipe(reader)
  .pipe(transform)
  .on('finish', () => printStats());

function getAccessor(path) {
  const parts = path.split('.');
  return {
    name: path,
    accessor: obj => {
      for (let i = 0; i < parts.length; i++) {
        obj = obj && obj[parts[i]];
      }
      return obj;
    }
  };
}

function getType(value) {
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
}

function addToStats(key, value) {
  if (value === undefined || value === null) {
    return;
  }
  const type = getType(value);
  if (!stats[key]) {
    stats[key] = {type, count: 0};
  }
  const stat = stats[key];
  stat.count++;

  if (type !== stat.type) {
    stat.types = stat.types || new Set(stat.type);
    stat.types.add(type);
  } else if (type === 'number') {
    if (!('sum' in stat)) {
      stat.sum = 0;
      stat.min = Infinity;
      stat.max = -Infinity;
    }
    stat.sum += value;
    stat.min = Math.min(stat.min, value);
    stat.max = Math.max(stat.max, value);
  } else if (type === 'string') {
    stat.values = stat.values || new Set();
    if (stat.values.size < MAX_UNIQUE_VALUES) {
      stat.values.add(value);
    }
  } else if (type === 'boolean') {
    if (value) {
      stat.boolean_true = (stat.boolean_true || 0) + 1;
    } else {
      stat.boolean_false = (stat.boolean_false || 0) + 1;
    }
  }
}

function printStats() {
  for (const key in stats) {
    const stat = stats[key];
    if (stat.types) {
      console.log(`${key} (${Array.from(stat.types).join(', ')})`);
    } else {
      console.log(clc.cyanBright.bold(`${key} (${stat.type})`));
    }
    console.log(`  ${clc.green('count')}  ${stat.count}`);

    if (stat.type === 'number') {
      console.log(`   ${clc.green('mean')}  ${stat.sum / stat.count}`);
      console.log(`    ${clc.green('min')}  ${stat.min}`);
      console.log(`    ${clc.green('max')}  ${stat.max}`);
    } else if (stat.type === 'string') {
      console.log(` ${clc.green('values')}  ${Array.from(stat.values).map(str => str.length > MAX_STRING_LENGTH ? str.slice(0, MAX_STRING_LENGTH - 2) + '..' : str).join(', ')}\
${stat.values.size >= MAX_UNIQUE_VALUES ? `, ...(more than ${MAX_UNIQUE_VALUES - 1})` : ''}`);
    } else if (stat.type === 'boolean') {
      console.log(`   ${clc.green('true')}  ${stat.boolean_true || 0}`);
      console.log(`  ${clc.green('false')}  ${stat.boolean_false || 0}`);
    }
  }
}
