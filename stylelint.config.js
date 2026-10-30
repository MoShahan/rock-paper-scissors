"use strict";

module.exports = {
	extends: ["stylelint-config-standard"],
	rules: {
		"color-hex-length": "short",
		"selector-class-pattern": "^([a-z][a-z0-9]*)(-[a-z0-9]+)*$",
	},
};
