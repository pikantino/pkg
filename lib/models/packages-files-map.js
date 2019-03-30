"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var fs = require("fs");
var PackagesFilesMap = /** @class */ (function () {
    function PackagesFilesMap(map, modulesFolder) {
        this.map = map;
        this.modulesFolder = modulesFolder;
    }
    PackagesFilesMap.prototype.resolvePath = function (lookUpPackage) {
        var packageName = Object.keys(this.map).find(function (knownPackage) {
            return lookUpPackage === knownPackage ||
                lookUpPackage.startsWith(knownPackage + '/');
        });
        if (!packageName) {
            return lookUpPackage + '.js';
        }
        if (lookUpPackage === packageName) {
            return this.modulesFolder + path.join(lookUpPackage, this.map[packageName].entry);
        }
        var subModule = lookUpPackage.slice(packageName.length + 1);
        var subModulePath = path.join(this.map[packageName].folder, subModule);
        if (fs.existsSync(subModulePath + '.js')) {
            return this.modulesFolder + lookUpPackage + '.js';
        }
        if (fs.statSync(subModulePath).isDirectory()) {
            var subModuleIndexPath = path.join(subModulePath, 'index.js');
            if (fs.existsSync(subModuleIndexPath)) {
                return this.modulesFolder + lookUpPackage + '/index.js';
            }
        }
        throw new Error(lookUpPackage + " has no import mapping");
    };
    return PackagesFilesMap;
}());
exports.PackagesFilesMap = PackagesFilesMap;
