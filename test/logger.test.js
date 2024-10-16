import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { createSilentLogger, createVerboseLogger } from "../src/logger";

let consoleErrorSpy;
beforeEach(() => {
	consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

test("verbose logger should log errors to stderr", () => {
	const logger = createVerboseLogger();
	logger.error(new Error("Some error"));
	expect(consoleErrorSpy).toHaveBeenCalledOnce();
	expect(consoleErrorSpy).toHaveBeenLastCalledWith("Some error");
});

test("silent logger should not log errors", () => {
	const logger = createSilentLogger();
	logger.error(new Error("Some error"));
	expect(consoleErrorSpy).not.toHaveBeenCalled();
});
