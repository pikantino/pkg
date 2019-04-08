"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var fs = require("fs");
var PackagesFilesMap = /** @class */ (function () {
    function PackagesFilesMap(modules, globals, modulesFolder) {
        this.modules = modules;
        this.globals = globals;
        this.modulesFolder = modulesFolder;
    }
    PackagesFilesMap.prototype.isModule = function (key) {
        return this.isKey(key, this.modules);
    };
    PackagesFilesMap.prototype.isGlobal = function (key) {
        return this.isKey(key, this.globals);
    };
    PackagesFilesMap.prototype.resolvePath = function (lookUpPackage) {
        var packageName = Object.keys(this.modules).find(function (knownPackage) {
            return lookUpPackage === knownPackage ||
                lookUpPackage.startsWith(knownPackage + '/');
        });
        if (!packageName) {
            if (lookUpPackage.endsWith('.js')) {
                return lookUpPackage;
            }
            return lookUpPackage + '.js';
        }
        if (lookUpPackage === packageName) {
            return this.modulesFolder + path.join(lookUpPackage, this.modules[packageName].entry);
        }
        var subModule = lookUpPackage.slice(packageName.length + 1);
        var subModulePath = path.join(this.modules[packageName].folder, subModule);
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
    PackagesFilesMap.prototype.isKey = function (key, map) {
        return Object.keys(map).some(function (moduleKey) {
            return key.startsWith(moduleKey);
        });
    };
    return PackagesFilesMap;
}());
exports.PackagesFilesMap = PackagesFilesMap;
