"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var fs = require("fs");
var glob = require("glob");
var transform = require("transform-imports");
var path_utils_1 = require("../utils/path-utils");
var packages_files_map_1 = require("../models/packages-files-map");
var fs_utils_1 = require("../utils/fs-utils");
function readDependencies() {
    return new Promise(function (resolve) {
        fs.readFile('./package.json', function (error, data) {
            if (error) {
                throw error;
            }
            resolve(JSON.parse(data.toString()).dependencies);
        });
    });
}
function createPackageFilesMap(dependencies, modulesFolderPath, cwd) {
    return __awaiter(this, void 0, void 0, function () {
        var map;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    map = {};
                    return [4 /*yield*/, Promise.all(dependencies.map(function (key) {
                            var dependencyPath = path.join(cwd, 'node_modules', key);
                            var packageJsonPath = path.join(dependencyPath, 'package.json');
                            if (fs.existsSync(packageJsonPath)) {
                                var packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
                                var es6EntryPath = packageJson['es2015'];
                                if (es6EntryPath) {
                                    var es6EntryFileName = path_utils_1.getFileName(es6EntryPath);
                                    var es6FolderPath = path.join(dependencyPath, es6EntryPath, '../');
                                    return setDependencyMap(es6FolderPath, es6EntryFileName).then(function (packageFiles) {
                                        map[key] = packageFiles;
                                    }, function () {
                                        console.log("Cannot read " + key + "'s files ");
                                    });
                                }
                            }
                        }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/, new packages_files_map_1.PackagesFilesMap(map, "/" + modulesFolderPath + "/")]; // TODO
            }
        });
    });
}
// modulesFolder format %folder_name%
function copyFiles(packagesFilesMap, outDir, modulesFolder, cwd) {
    return Promise.all(Object.keys(packagesFilesMap.map).map(function (key) {
        var outDirPath = path.join(cwd, outDir, modulesFolder, key);
        fs.mkdirSync(outDirPath, { recursive: true });
        console.log(key);
        packagesFilesMap.map[key].files.forEach(function (file) {
            var filePath = path.join(packagesFilesMap.map[key].folder, file);
            var code = fs.readFileSync(filePath).toString();
            var transformedCode = transform(code, function (importDefs) {
                importDefs.forEach(function (importDef) {
                    importDef.source = packagesFilesMap.resolvePath(importDef.source);
                });
            }).replace(/(export.*['"])(.*)(['"];)/gm, '$1$2.js$3');
            return fs_utils_1.writeFile(path.join(outDirPath, file), filePath, transformedCode);
        });
    }));
}
function setDependencyMap(es6FolderPath, es6EntryFileName) {
    // `${es6FolderPath}/**/+(*.js|*.map)`
    return new Promise(function (resolve) { return glob(es6FolderPath + "/**/*.js", function (error, files) {
        if (error) {
            throw error;
        }
        var packageFiles = files.map(function (file) {
            return path.relative(es6FolderPath, file);
        });
        resolve({
            entry: es6EntryFileName,
            files: packageFiles,
            folder: es6FolderPath
        });
    }); });
}
function pack() {
    return __awaiter(this, void 0, void 0, function () {
        var cwd, outDir, modulesFolder, dependencies, packageFilesMap;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cwd = process.cwd();
                    outDir = 'dist';
                    modulesFolder = 'web_modules';
                    return [4 /*yield*/, readDependencies()
                            .then(null, function () {
                            throw new Error('Cannot read package.json');
                        })];
                case 1:
                    dependencies = _a.sent();
                    return [4 /*yield*/, createPackageFilesMap(Object.keys(dependencies), modulesFolder, cwd)
                            .then(null, function (error) {
                            throw new Error("Cannot create packages files map: \n " + JSON.stringify(error));
                        })];
                case 2:
                    packageFilesMap = _a.sent();
                    return [4 /*yield*/, copyFiles(packageFilesMap, outDir, modulesFolder, cwd)
                            .then(null, function (error) {
                            throw new Error("Cannot copy packages: \n " + JSON.stringify(error));
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/, packageFilesMap];
            }
        });
    });
}
exports.pack = pack;
