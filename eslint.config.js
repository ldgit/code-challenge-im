import globals from "globals";
import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import vitest from "@vitest/eslint-plugin";

export default [
	pluginJs.configs.recommended,
	eslintConfigPrettier,
	{
		files: ["test/**"],
		plugins: {
			vitest,
		},
		rules: {
			...vitest.configs.recommended.rules,
			"vitest/no-focused-tests": ["error", { fixable: false }],
		},
	},
	{ languageOptions: { globals: globals.node } },
	{
		ignores: ["coverage/*"],
	},
];
