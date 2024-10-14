#!/usr/bin/env node

import * as fs from 'node:fs';
import readline from 'node:readline';
import { parseUrlFromText } from './src/parseUrlFromText.js';

const fileToParse = process.argv[2];

let stream = typeof fileToParse === 'undefined' ? process.stdin : fs.createReadStream(fileToParse);
const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

rl.on('line', (line) => {
  const urls = parseUrlFromText(line);
  console.log(urls);
})

rl.on('close', () => {
  process.exit(0);
})
