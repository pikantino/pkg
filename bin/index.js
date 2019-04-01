#! /usr/bin/env node
const pack = require('../lib/index.js').pack;

const argv = require('yargs')
    .describe('outDir', 'Output directory')
    .default('outDir', 'dist')
    .alias('outDir', 'o')
    .describe('modules', 'Modules output directory')
    .default('modules', 'web_modules')
    .alias('outDir', 'm')
    .help()
    .argv;

pack(argv.outDir, argv.modules);
