"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scan = scan;
// lib/score.ts  (very top)
console.log('🟢 NEW SCORE MODULE LOADED', Date.now());
var plugins_1 = require("./plugins");
function scan(jenkinsText) {
    var lines = jenkinsText.split('\n');
    var lineCount = lines.length;
    var isScripted = /node\s*\{/.test(jenkinsText);
    var isDeclarative = /pipeline\s*\{/.test(jenkinsText);
    var pluginHits = (0, plugins_1.detectPlugins)(jenkinsText);
    var pluginCount = pluginHits.length;
    // Simple tier calculation
    var tier = 'simple';
    // If scripted, it's at least medium
    if (isScripted) {
        tier = 'medium';
    }
    // Plugin-based tiers
    if (pluginCount > 10 || (isScripted && pluginCount > 5)) {
        tier = 'complex';
    }
    else if (pluginCount > 5) {
        tier = 'medium';
    }
    // Line count can bump it up
    if (lineCount > 100 && tier === 'simple') {
        tier = 'medium';
    }
    if (lineCount > 200 || (lineCount > 100 && pluginCount > 8)) {
        tier = 'complex';
    }
    var warnings = [];
    if (isScripted) {
        warnings.push('Scripted pipelines are harder to migrate than declarative pipelines');
    }
    if (pluginCount > 15) {
        warnings.push('High plugin count may indicate overly complex pipeline');
    }
    console.log('Debug:', { pluginCount: pluginCount, lineCount: lineCount, isScripted: isScripted, tier: tier, plugins: pluginHits.map(function (p) { return p.name; }) });
    return {
        pluginHits: pluginHits.map(function (p) { return ({
            key: p.key,
            name: p.name,
            category: p.category || 'other'
        }); }),
        pluginCount: pluginCount,
        scripted: isScripted,
        declarative: isDeclarative,
        tier: tier,
        lineCount: lineCount,
        warnings: warnings,
        timestamp: Date.now()
    };
}
