import globals from "globals";
import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
	pluginJs.configs.recommended,
	eslintConfigPrettier,
	{ languageOptions: { globals: globals.node } },
	{
		ignores: ["coverage/*"],
	},
];
