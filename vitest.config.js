import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Exclude integration tests from main test run because they are too slow.
		// We run integration tests using a separate script (check in package.json).
		exclude: [...configDefaults.exclude, "test/integration/*"],
	},
});
