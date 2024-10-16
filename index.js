#!/usr/bin/env node

import * as fs from "node:fs";
import readline from "node:readline";
import { program } from "commander";
import { parseUrlFromText } from "./src/parseUrlFromText.js";
import { createCallQueue } from "./src/callQueue.js";
import { createSilentLogger, createVerboseLogger } from "./src/logger.js";

if (!process.env.IM_SECRET) {
	throw new Error("This script needs IM_SECRET env variable to function.");
}

program.argument(
	"[file-to-parse]",
	"[OPTIONAL] Relative path to file that will be parsed for URLs. If omitted script reads input from stdin.",
);
program.option(
	"-d, --debug",
	"Outputs all errors to the console, helps with debugging.",
);
program.parse();
const options = program.opts();
const fileToParse = program.args[0];
const logger = options.debug ? createVerboseLogger() : createSilentLogger();

let stream =
	typeof fileToParse === "undefined"
		? process.stdin
		: fs.createReadStream(fileToParse);
const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

const callQueue = createCallQueue({ logger });

rl.on("line", (line) => {
	const urls = parseUrlFromText(line);

	urls.forEach((url) => {
		callQueue.add(url);
	});
});
