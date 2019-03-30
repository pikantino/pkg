"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var console_utils_1 = require("./console-utils");
function writeFile(toPath, fromPath, file) {
    return new Promise(function (resolve) { return fs.writeFile(toPath, file, function (writeError) {
        if (!writeError) {
            console_utils_1.log(fromPath + " => " + toPath);
            resolve();
        }
        else if (writeError.code === 'ENOENT') {
            var dir_1 = path.resolve(toPath, '../');
            fs.mkdir(dir_1, { recursive: true }, function (mkDirError) {
                if (!mkDirError) {
                    writeFile(toPath, fromPath, file).then(function () { return resolve(); });
                }
                else {
                    throw new Error("Cannot create directory " + dir_1 + ": \n " + JSON.stringify(mkDirError));
                }
            });
        }
        else {
            throw new Error("Cannot write to " + toPath + ": \n " + JSON.stringify(writeError));
        }
    }); });
}
exports.writeFile = writeFile;
function copyFile(fromPath, toPath) {
    return new Promise(function (resolve) { return fs.copyFile(fromPath, toPath, function (copyError) {
        if (!copyError) {
            console_utils_1.log(fromPath + " => " + toPath);
            resolve();
        }
        else if (copyError.code === 'ENOENT') {
            var dir_2 = path.resolve(toPath, '../');
            fs.mkdir(dir_2, { recursive: true }, function (mrDirError) {
                if (!mrDirError) {
                    copyFile(fromPath, toPath).then(function () { return resolve(); });
                }
                else {
                    throw new Error("Cannot create directory " + dir_2 + ": \n " + JSON.stringify(mrDirError));
                }
            });
        }
        else {
            throw new Error("Cannot copy from " + fromPath + " to " + toPath + ": \n " + JSON.stringify(copyError));
        }
    }); });
}
exports.copyFile = copyFile;
