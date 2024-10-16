#!/usr/bin/env node

import * as fs from "node:fs";
import readline from "node:readline";
import { parseUrlFromText } from "./src/parseUrlFromText.js";
import { createCallQueue } from "./src/callQueue.js";

if (!process.env.IM_SECRET) {
	throw new Error("This script needs IM_SECRET env variable to function.");
}

const fileToParse = process.argv[2];
let stream =
	typeof fileToParse === "undefined"
		? process.stdin
		: fs.createReadStream(fileToParse);
const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

const callQueue = createCallQueue();
rl.on("line", (line) => {
	const urls = parseUrlFromText(line);

	urls.forEach((url) => {
		callQueue.add(url);
	});
});
