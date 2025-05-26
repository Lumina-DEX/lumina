module.exports = {
	root: true,
	env: {
		browser: true,
		node: true,
		jest: true
	},
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/eslint-recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:o1js/recommended"
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: "latest"
	},
	plugins: ["@typescript-eslint", "o1js", "unused-imports"],
	rules: {
		"no-constant-condition": "off",
		"prefer-const": "off",
		"no-unused-vars": "off",
		"unused-imports/no-unused-imports": "error",
		"unused-imports/no-unused-vars": [
			"warn",
			{
				vars: "all",
				varsIgnorePattern: "^_",
				args: "after-used",
				argsIgnorePattern: "^_"
			}
		]
	}
}
