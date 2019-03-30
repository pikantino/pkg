import * as path from 'path';
import * as fs from 'fs';
import * as glob from 'glob';
import * as transform from 'transform-imports';

import {getFileName} from "../utils/path-utils";
import {PackagesFilesMap} from "../models/packages-files-map";
import {writeFile} from "../utils/fs-utils";
import {PackageFiles} from "../models/package-files";

function readDependencies(): Promise<{ [key: string]: string }> {
    return new Promise((resolve) => {
        fs.readFile('./package.json', (error: NodeJS.ErrnoException, data: Buffer) => {
            if (error) {
                throw error;
            }
            resolve(JSON.parse(data.toString()).dependencies);
        });
    });
}

async function createPackageFilesMap(dependencies: string[], modulesFolderPath: string, cwd: string): Promise<PackagesFilesMap> {
    const map: { [packageName: string]: PackageFiles } = {};

    await Promise.all(dependencies.map((key: string) => {
        const dependencyPath = path.join(cwd, 'node_modules', key);
        const packageJsonPath = path.join(dependencyPath, 'package.json');

        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
            const es6EntryPath = packageJson['es2015'];

            if (es6EntryPath) {
                const es6EntryFileName = getFileName(es6EntryPath);
                const es6FolderPath = path.join(dependencyPath, es6EntryPath, '../');

                return setDependencyMap(es6FolderPath, es6EntryFileName).then((packageFiles: PackageFiles) => {
                    map[key] = packageFiles;
                }, () => {
                    console.log(`Cannot read ${key}'s files `);
                });
            }
        }
    }));

    return new PackagesFilesMap(map, `/${modulesFolderPath}/`); // TODO
}

// modulesFolder format %folder_name%
function copyFiles(packagesFilesMap: PackagesFilesMap, outDir: string, modulesFolder: string, cwd: string): Promise<void[]> {
    return Promise.all(Object.keys(packagesFilesMap.map).map((key: string) => {
        const outDirPath: string = path.join(cwd, outDir, modulesFolder, key);

        fs.mkdirSync(outDirPath, {recursive: true});

        console.log(key);
        packagesFilesMap.map[key].files.forEach((file: string) => {
            const filePath: string = path.join(packagesFilesMap.map[key].folder, file);
            const code: string = fs.readFileSync(filePath).toString();
            const transformedCode: string = transform(code, (importDefs: { source: string }[]) => {
                importDefs.forEach((importDef) => {
                    importDef.source = packagesFilesMap.resolvePath(importDef.source);
                });
            }).replace(/(export.*['"])(.*)(['"];)/gm, '$1$2.js$3');

            return writeFile(path.join(outDirPath, file), filePath, transformedCode);
        });
    }));
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

export async function pack(): Promise<PackagesFilesMap> {
    const cwd = process.cwd();

    const outDir: string = 'dist';
    const modulesFolder = 'web_modules';

    const dependencies = await readDependencies()
        .then(null, () => {
            throw new Error('Cannot read package.json');
        });

    const packageFilesMap: PackagesFilesMap = await createPackageFilesMap(Object.keys(dependencies), modulesFolder, cwd)
        .then(null, (error: NodeJS.ErrnoException) => {
            throw new Error(`Cannot create packages files map: \n ${JSON.stringify(error)}`);
        });

    await copyFiles(packageFilesMap, outDir, modulesFolder, cwd)
        .then(null, (error: any) => {
            throw new Error(`Cannot copy packages: \n ${JSON.stringify(error)}`);
        });

    return packageFilesMap;
}
