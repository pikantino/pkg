import * as path from 'path';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as transform from 'transform-imports';
import * as ProgressBar from 'progress';

import {getFileName} from "../utils/get-file-name";
import {PackagesFilesMap} from "../models/packages-files-map";
import {PackageFiles} from "../models/package-files";
import {handleError} from "../utils/handle-error";

function readDependencies(packagePath: string): Promise<{ [key: string]: string }> {
    return readPackageJson(packagePath).then((packageJson: { [key: string]: any }) =>
        Promise.resolve(packageJson.dependencies))
        .catch((error: Error) => handleError(error, `Cannot read package.json in ${packagePath} folder`))
}

function readPackageJson(folderPath: string): Promise<{ [key: string]: any }> {
    return fs.readFile(path.join(folderPath, 'package.json'))
        .then((buffer: Buffer) => Promise.resolve(JSON.parse(buffer.toString())));
}

async function locatePackageFiles(packagePath: string): Promise<PackageFiles> {
    const packageJson: { [key: string]: any } = await readPackageJson(packagePath)
        .catch((error: Error) => handleError(error, `Cannot read package.json in ${packagePath} folder`, {}));

    if (packageJson['es2015']) {
        const es6EntryPath = packageJson['es2015'];

        const es6EntryFileName = getFileName(es6EntryPath);
        const es6FolderPath = path.join(packagePath, es6EntryPath, '../');

        return await setDependencyMap(es6FolderPath, es6EntryFileName);
    }
}

async function createPackagesFilesMap(dependencies: string[], modulesFolderPath: string, cwd: string): Promise<PackagesFilesMap> {
    const map: { [packageName: string]: PackageFiles } = {};

    const progress: ProgressBar = createProgressBar(dependencies.length, 'Reading dependencies...');

    for (let key of dependencies) {
        progress.render({
            token1: key
        });

        const files: PackageFiles = await locatePackageFiles(path.join(cwd, 'node_modules', key))
            .catch((error: Error) => handleError(error, `Cannot locate ${key} package files`, null));

        if (files) {
            map[key] = files;
        }

        progress.tick();
    }

    return new PackagesFilesMap(map, `/${modulesFolderPath}/`); // TODO
}

function transformImports(code: string, packagesFilesMap: PackagesFilesMap): string {
    return transform(code, (importDefs: { source: string }[]) => {
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
    const progress: ProgressBar = createProgressBar(Object.keys(packagesFilesMap.map).length, 'Copying files...');

    for (let key in packagesFilesMap.map) {
        const outDirPath: string = path.join(cwd, outDir, modulesFolder, key);

        fs.ensureDirSync(outDirPath);

        for (let file of packagesFilesMap.map[key].files) {
            progress.render({
                token1: key,
                token2: file
            });
            await copyFile(packagesFilesMap.map[key].folder, file, outDirPath, packagesFilesMap)
                .catch((error: Error) => handleError(error, `Cannot copy file ${file} of ${key} package`));
        }

        progress.tick();
    }

    progress.terminate();
}

function setDependencyMap(es6FolderPath: string, es6EntryFileName: string): Promise<PackageFiles> {
    // `${es6FolderPath}/**/+(*.js|*.map)`
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

    return packageFilesMap;
}
