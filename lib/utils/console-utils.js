"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var debug = false;
function log() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (debug) {
        console.log.apply(console, args);
    }
}
exports.log = log;
function error() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log.apply(console, args);
}
exports.error = error;
