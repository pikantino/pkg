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
var fs = require("fs-extra");
var glob = require("glob");
var transform = require("transform-imports");
var ProgressBar = require("progress");
var get_file_name_1 = require("../utils/get-file-name");
var packages_files_map_1 = require("../models/packages-files-map");
var handle_error_1 = require("../utils/handle-error");
function readDependencies(packagePath) {
    return readPackageJson(packagePath).then(function (packageJson) {
        return Promise.resolve(packageJson.dependencies);
    })
        .catch(function (error) { return handle_error_1.handleError(error, "Cannot read package.json in " + packagePath + " folder"); });
}
function readPackageJson(folderPath) {
    return fs.readFile(path.join(folderPath, 'package.json'))
        .then(function (buffer) { return Promise.resolve(JSON.parse(buffer.toString())); });
}
function locatePackageFiles(packagePath) {
    return __awaiter(this, void 0, void 0, function () {
        var packageJson, es6EntryPath, es6EntryFileName, es6FolderPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readPackageJson(packagePath)
                        .catch(function (error) { return handle_error_1.handleError(error, "Cannot read package.json in " + packagePath + " folder", {}); })];
                case 1:
                    packageJson = _a.sent();
                    if (!packageJson['es2015']) return [3 /*break*/, 3];
                    es6EntryPath = packageJson['es2015'];
                    es6EntryFileName = get_file_name_1.getFileName(es6EntryPath);
                    es6FolderPath = path.join(packagePath, es6EntryPath, '../');
                    return [4 /*yield*/, setDependencyMap(es6FolderPath, es6EntryFileName)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function createPackagesFilesMap(dependencies, modulesFolderPath, cwd) {
    return __awaiter(this, void 0, void 0, function () {
        var map, progress, _loop_1, _i, dependencies_1, key;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    map = {};
                    progress = createProgressBar(dependencies.length, 'Reading dependencies...');
                    _loop_1 = function (key) {
                        var files;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    progress.render({
                                        token1: key
                                    });
                                    return [4 /*yield*/, locatePackageFiles(path.join(cwd, 'node_modules', key))
                                            .catch(function (error) { return handle_error_1.handleError(error, "Cannot locate " + key + " package files", null); })];
                                case 1:
                                    files = _a.sent();
                                    if (files) {
                                        map[key] = files;
                                    }
                                    progress.tick();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, dependencies_1 = dependencies;
                    _a.label = 1;
                case 1:
                    if (!(_i < dependencies_1.length)) return [3 /*break*/, 4];
                    key = dependencies_1[_i];
                    return [5 /*yield**/, _loop_1(key)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, new packages_files_map_1.PackagesFilesMap(map, "/" + modulesFolderPath + "/")]; // TODO
            }
        });
    });
}
function transformImports(code, packagesFilesMap) {
    return transform(code, function (importDefs) {
        importDefs.forEach(function (importDef) {
            importDef.source = packagesFilesMap.resolvePath(importDef.source);
        });
    });
}
function transformExports(code) {
    return code.replace(/(export.*['"])(.*)(['"];)/gm, '$1$2.js$3');
}
function copyFile(packageFolder, fileRelativePath, outDirPath, packagesFilesMap) {
    var filePath = path.join(packageFolder, fileRelativePath);
    var code = fs.readFileSync(filePath).toString();
    return fs.outputFile(path.join(outDirPath, fileRelativePath), transformExports(transformImports(code, packagesFilesMap)));
}
// modulesFolder format %folder_name%
function copyFiles(packagesFilesMap, outDir, modulesFolder, cwd) {
    return __awaiter(this, void 0, void 0, function () {
        var progress, _loop_2, _a, _b, _i, key;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    progress = createProgressBar(Object.keys(packagesFilesMap.map).length, 'Copying files...');
                    _loop_2 = function (key) {
                        var outDirPath, _loop_3, _i, _a, file;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    outDirPath = path.join(cwd, outDir, modulesFolder, key);
                                    fs.mkdirSync(outDirPath, { recursive: true });
                                    _loop_3 = function (file) {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    progress.render({
                                                        token1: key,
                                                        token2: file
                                                    });
                                                    return [4 /*yield*/, copyFile(packagesFilesMap.map[key].folder, file, outDirPath, packagesFilesMap)
                                                            .catch(function (error) { return handle_error_1.handleError(error, "Cannot copy file " + file + " of " + key + " package"); })];
                                                case 1:
                                                    _a.sent();
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _i = 0, _a = packagesFilesMap.map[key].files;
                                    _b.label = 1;
                                case 1:
                                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                                    file = _a[_i];
                                    return [5 /*yield**/, _loop_3(file)];
                                case 2:
                                    _b.sent();
                                    _b.label = 3;
                                case 3:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 4:
                                    progress.tick();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _a = [];
                    for (_b in packagesFilesMap.map)
                        _a.push(_b);
                    _i = 0;
                    _c.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    key = _a[_i];
                    return [5 /*yield**/, _loop_2(key)];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    progress.terminate();
                    return [2 /*return*/];
            }
        });
    });
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
function createProgressBar(length, message) {
    return new ProgressBar(message + " [:bar] :token1 :token2", {
        complete: '=',
        incomplete: ' ',
        width: 20,
        clear: true,
        total: length,
        callback: function () { return console.log(message + " Done."); }
    });
}
function pack(outDir, modulesFolder) {
    return __awaiter(this, void 0, void 0, function () {
        var cwd, dependencies, packageFilesMap;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cwd = process.cwd();
                    return [4 /*yield*/, readDependencies('./')
                            .catch(function (error) { return handle_error_1.handleError(error, "Cannot read package.json file"); })];
                case 1:
                    dependencies = _a.sent();
                    return [4 /*yield*/, createPackagesFilesMap(Object.keys(dependencies), modulesFolder, cwd)
                            .catch(function (error) { return handle_error_1.handleError(error, "Cannot create packages files map"); })];
                case 2:
                    packageFilesMap = _a.sent();
                    return [4 /*yield*/, copyFiles(packageFilesMap, outDir, modulesFolder, cwd)
                            .catch(function (error) { return handle_error_1.handleError(error, "Cannot copy dependencies"); })];
                case 3:
                    _a.sent();
                    console.log('Packages are built.');
                    return [2 /*return*/, packageFilesMap];
            }
        });
    });
}
exports.pack = pack;
