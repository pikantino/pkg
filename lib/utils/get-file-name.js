"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getFileName(filePath) {
    var parts = filePath.split('/');
    return parts[parts.length - 1];
}
exports.getFileName = getFileName;
