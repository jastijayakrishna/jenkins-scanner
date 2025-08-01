"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_fs_1 = require("node:fs");
var score_1 = require("../lib/score"); // ← normal TS import
var text = node_fs_1.default.readFileSync('./public/demo-complex.Jenkinsfile', 'utf8');
var result = (0, score_1.scan)(text);
console.log(JSON.stringify(result, null, 2));
