import { expect, test } from 'vitest';
import {parseUrlFromText} from '../src/parseUrlFromText.js';

test('parseUrlFromText should return empty array for empty text', () => {
  expect(parseUrlFromText('')).toEqual([]);
});

test('parseUrlFromText should return empty array for text that has no urls', () => {
  expect(parseUrlFromText('just some text without urls')).toEqual([]);
});

test('parseUrlFromText should return empty array for text that has url outside square brackets', () => {
  expect(parseUrlFromText('url www.google.com outside [] brackets')).toEqual([]);
});

[
  'url ]www.google.com outside [ brackets',
  'url [ www.google.com outside brackets',
].forEach((text) => {
  test(`parseUrlFromText should return empty array for text that has url inside invalid square brackets ${text}`, () => {
    expect(parseUrlFromText(text)).toEqual([]);
  });
});

[
  "url \\[ www.google.com ]",
  "url \\\\[ www.google.com ]",
  "url [ www.google.com \\]",
  "url [ www.google.com \\\\]",
].forEach((text) => {
  test(`parseUrlFromText should return empty array for text that has url inside escaped square brackets "${text}"`, () => {
    expect(parseUrlFromText(text)).toEqual([]);
  });
});

[
  ["url [ www.google.com ]", 'www.google.com'],
  ["url [ google.com ]", 'google.com'],
  ["url ] []] [ google.com ]", 'google.com'],
  ["url ] []] [ google.com?test=query&string=1 ]", 'google.com?test=query&string=1'],
  ["url with [ extra text www.example.com inside brackets ]", 'www.example.com'],
  ["multiple urls [bla www.first.com more text www.second.com other stuff]", 'www.second.com'],
  ["multiple levels[ www.first.com www.second.com]", 'www.second.com'],
  ["multiple levels[ [www.first.com] www.second.com]", 'www.second.com'],
  ["multiple levels[ www.first.com [www.third.com]]", 'www.third.com'],
  ["multiple urls [ www.first.com] some text [ www.third.com ]]", 'www.third.com'],
  // Only the outermost bracket should count.
  ["multiple urls [[ www.first.com] some text [www.third.com]]", 'www.third.com'],
  ["multiple urls [ www.first.com] some [[www.second.com] text [www.third.com]]", 'www.third.com'],
].forEach(([text, expectedUrl]) => {
  test(`parseUrlFromText should return array with single url that is inside square brackets "${text}"`, () => {
    expect(parseUrlFromText(text)).toEqual([expectedUrl]);
  });
});

[
  ["multiple urls [ www.first.com] [www.third.com]", ['www.first.com', 'www.third.com']],
  ["multiple urls [ www.first.com] [][][][]] [www.third.com]", ['www.first.com', 'www.third.com']],
  ["multiple urls [google.com][][][] [ www.first.com] ] [www.third.com]", ['www.first.com', 'www.third.com']],
  ["multiple urls [ www.first.com] some text [www.third.com]", ['www.first.com', 'www.third.com']],
  ["multiple urls [ www.first.com] some [www.second.com] text [www.third.com]", ['www.first.com', 'www.second.com', 'www.third.com']],
].forEach(([text, expectedUrl]) => {
  test(`parseUrlFromText should return array with multiple urls that are inside different square brackets "${text}"`, () => {
    expect(parseUrlFromText(text)).toEqual(expectedUrl);
  });
});
