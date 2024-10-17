import { spawn } from "node:child_process";
import path from "node:path";
import { expect, test, describe } from "vitest";

const wait = (milliseconds) =>
	new Promise((resolve) => setTimeout(resolve, milliseconds));

const pathToIndexJs = path.join(import.meta.dirname, "..", "..", "index.js");

describe("e2e tests", () => {
	test("basic.txt", async () => {
		// Start the script and monitor output.
		const subprocess = spawn(
			pathToIndexJs,
			[path.join(import.meta.dirname, "fixtures", "basic.txt")],
			{
				env: { IM_SECRET: "integration", PATH: process.env.PATH },
				stdio: "pipe",
			},
		);
		let output = "";
		subprocess.stdout.on("data", (data) => {
			output += data;
		});

		await wait(1000);
		expect(output.trim()).toEqual('{"url":"www.google.com","title":"Google"}');
		output = "";

		await wait(500);
		expect(output.trim()).toEqual("");

		await wait(501);
		expect(output.trim()).toEqual(
			'{"url":"www.wikipedia.com","title":"Wikipedia","email":"28e358cfede71a5157cebf1daea20d22be6ef06eedf8e42b3d826cacb734c265"}',
		);
		output = "";

		await wait(1000);
		expect(output.trim()).toEqual(
			'{"url":"https://en.wikipedia.org/wiki/Email_address","title":"Email address - Wikipedia","email":"ebce30eeec454047ba4ee9bd68bda841881c7b9b167ce157c8630128970a4a4d"}',
		);
		output = "";
	});

	test("with no filepath provided", async () => {
		const subprocess = spawn(pathToIndexJs, [], {
			env: { IM_SECRET: "integration", PATH: process.env.PATH },
			stdio: "pipe",
		});
		let output = "";
		subprocess.stdout.on("data", (data) => {
			output += data;
		});

		subprocess.stdin.write("test [www.google.com]\n");

		await wait(1100);
		expect(output.trim()).toEqual('{"url":"www.google.com","title":"Google"}');
		output = "";

		subprocess.stdin.write("test [www.google.hr]\n");
		subprocess.stdin.write(
			"test [https://en.wikipedia.org/wiki/Email_address]\n",
		);

		await wait(1000);
		expect(output.trim()).toEqual('{"url":"www.google.hr","title":"Google"}');
		output = "";
		await wait(1000);
		expect(output.trim()).toEqual(
			'{"url":"https://en.wikipedia.org/wiki/Email_address","title":"Email address - Wikipedia","email":"ebce30eeec454047ba4ee9bd68bda841881c7b9b167ce157c8630128970a4a4d"}',
		);
		output = "";
	});
});
