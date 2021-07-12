"use strict";
exports.__esModule = true;
var index_js_1 = require("../src/index.js");
var fs = require("fs");
var md = fs.readFileSync('./demo/test.md', 'utf-8');
index_js_1["default"].parse(md.toString());
