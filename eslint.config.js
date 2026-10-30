"use strict";

module.exports = [
	{
		files: ["**/*.js"],
		ignores: ["eslint.config.js", "stylelint.config.js"],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "script",
			globals: {
				document: "readonly",
				window: "readonly",
				Element: "readonly",
				location: "readonly",
			},
		},
		rules: {
			"comma-dangle": ["error", "always-multiline"],
			eqeqeq: "error",
			indent: ["error", "tab", { SwitchCase: 1 }],
			"no-multi-spaces": "error",
			"no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
			"no-trailing-spaces": "error",
			"no-undef": "error",
			"no-unused-vars": "error",
			"no-var": "error",
			"object-curly-spacing": ["error", "always"],
			"prefer-const": "error",
			quotes: ["error", "double"],
			semi: ["error", "always"],
		},
	},
];
