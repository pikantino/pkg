import * as path from 'path';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as transform from 'transform-imports';
import * as ProgressBar from 'progress';

import {getFileName} from "../utils/get-file-name";
import {PackagesFilesMap} from "../models/packages-files-map";
import {PackageFiles} from "../models/package-files";
import {handleError} from "../utils/handle-error";
import {PackageInfo} from "../models/package-info";

function readDependencies(packagePath: string): Promise<{ [key: string]: string }> {
    return readPackageJson(packagePath).then((packageJson: { [key: string]: any }) =>
        Promise.resolve(packageJson.dependencies))
        .catch((error: Error) => handleError(error, `Cannot read package.json in ${packagePath} folder`))
}

function readPackageJson(folderPath: string): Promise<{ [key: string]: any }> {
    return fs.readFile(path.join(folderPath, 'package.json'))
        .then((buffer: Buffer) => Promise.resolve(JSON.parse(buffer.toString())));
}

async function collectPackageInfo(packagePath: string): Promise<PackageInfo> {
    const packageJson: { [key: string]: any } = await readPackageJson(packagePath)
        .catch((error: Error) => handleError(error, `Cannot read package.json in ${packagePath} folder`, {}));

    if (packageJson['es2015']) {
        const es6EntryPath = packageJson['es2015'];

        const es6EntryFileName = getFileName(es6EntryPath);
        const es6FolderPath = path.join(packagePath, es6EntryPath, '../');

        return {
            files: await setDependencyMap(es6FolderPath, es6EntryFileName),
            global: false
        };
    } else if (packageJson['module']) {
        return {
            files: createSingleFilePackage(packagePath, packageJson['module']),
            global: false
        };
    } else {
        return {
            files: createSingleFilePackage(packagePath, packageJson['main']),
            global: true
        };
    }
}

function createSingleFilePackage(packagePath: string, modulePath: string): PackageFiles {
    return {
        entry: modulePath,
        folder: packagePath,
        files: [modulePath]
    };
}

async function createPackagesFilesMap(dependencies: string[], modulesFolderPath: string, cwd: string): Promise<PackagesFilesMap> {
    const modules: { [packageName: string]: PackageFiles } = {};
    const globals: { [packageName: string]: PackageFiles } = {};

    const progress: ProgressBar = createProgressBar(dependencies.length, 'Reading dependencies...');

    for (let key of dependencies) {
        progress.render({
            token1: key
        });

        const info: PackageInfo = await collectPackageInfo(path.join(cwd, 'node_modules', key))
            .catch((error: Error) => handleError(error, `Cannot collect ${key} package info`, null));

        if (info.global) {
            globals[key] = info.files;
        } else {
            modules[key] = info.files;
        }

        progress.tick();
    }

    return new PackagesFilesMap(modules, globals, `/${modulesFolderPath}/`); // TODO
}

function transformImports(code: string, packagesFilesMap: PackagesFilesMap): string {
    return transform(code, (importDefs: any[]) => {
        importDefs.forEach((importDef) => {
            importDef.source = packagesFilesMap.resolvePath(importDef.source);
        });
    });
}

function transformExports(code: string): string {
    return code.replace(/(export.*['"])(.*)(['"];)/gm, '$1$2.js$3');
}

function copyFile(packageFolder: string, fileRelativePath: string, outDirPath: string, packagesFilesMap: PackagesFilesMap): Promise<void> {
    const filePath: string = path.join(packageFolder, fileRelativePath);
    const code: string = fs.readFileSync(filePath).toString();

    return fs.outputFile(path.join(outDirPath, fileRelativePath), transformExports(transformImports(code, packagesFilesMap)));
}

// modulesFolder format %folder_name%
async function copyFiles(packagesFilesMap: PackagesFilesMap, outDir: string, modulesFolder: string, cwd: string): Promise<void> {
    const progress: ProgressBar = createProgressBar(Object.keys(packagesFilesMap.modules).length, 'Copying files...');

    for (let key in packagesFilesMap.modules) {
        const outDirPath: string = path.join(cwd, outDir, modulesFolder, key);

        fs.ensureDirSync(outDirPath);

        for (let file of packagesFilesMap.modules[key].files) {
            progress.render({
                token1: key,
                token2: file
            });
            await copyFile(packagesFilesMap.modules[key].folder, file, outDirPath, packagesFilesMap)
                .catch((error: Error) => handleError(error, `Cannot copy file ${file} of ${key} package`));
        }

        progress.tick();
    }

    progress.terminate();
}

function setDependencyMap(es6FolderPath: string, es6EntryFileName: string): Promise<PackageFiles> {
    // `${es6FolderPath}/**/+(*.js|*.modules)`
    return new Promise((resolve) => glob(`${es6FolderPath}/**/*.js`, (error: NodeJS.ErrnoException, files: string[]) => {
        if (error) {
            throw error;
        }

        const packageFiles = files.map((file) => {
            return path.relative(es6FolderPath, file);
        });
        resolve({
            entry: es6EntryFileName,
            files: packageFiles,
            folder: es6FolderPath
        });
    }));
}

function createProgressBar(length: number, message: string): ProgressBar {
    return new ProgressBar(`${message} [:bar] :token1 :token2`, {
        complete: '=',
        incomplete: ' ',
        width: 20,
        clear: true,
        total: length,
        callback: () => console.log(`${message} Done.`)
    });
}

export async function pack(outDir: string, modulesFolder): Promise<PackagesFilesMap> {
    const cwd = process.cwd();

    const dependencies = await readDependencies('./')
        .catch((error: Error) => handleError(error, `Cannot read package.json file`));

    const packageFilesMap: PackagesFilesMap = await createPackagesFilesMap(Object.keys(dependencies), modulesFolder, cwd)
        .catch((error: Error) => handleError(error, `Cannot create packages files map`));

    await copyFiles(packageFilesMap, outDir, modulesFolder, cwd)
        .catch((error: Error) => handleError(error, `Cannot copy dependencies`));

    console.log('Packages are built.');

    console.log(`${Object.keys(packageFilesMap.globals).join(', ')} should be in global scope`);

    return packageFilesMap;
}
