import * as fs from 'fs';
import * as path from 'path';

import {log} from "./console-utils";

export function writeFile(toPath: string, fromPath: string, file: string): Promise<void> {
    return new Promise((resolve) => fs.writeFile(toPath, file, (writeError: NodeJS.ErrnoException) => {
        if (!writeError) {
            log(`${fromPath} => ${toPath}`);
            resolve();
        } else if (writeError.code === 'ENOENT') {
            const dir = path.resolve(toPath, '../');
            fs.mkdir(dir, {recursive: true}, (mkDirError: NodeJS.ErrnoException) => {
                if (!mkDirError) {
                    writeFile(toPath, fromPath, file).then(() => resolve());
                } else {
                    throw new Error(`Cannot create directory ${dir}: \n ${JSON.stringify(mkDirError)}`);
                }
            });
        } else {
            throw new Error(`Cannot write to ${toPath}: \n ${JSON.stringify(writeError)}`);
        }
    }));
}

export function copyFile(fromPath: string, toPath: string): Promise<void> {
    return new Promise((resolve) => fs.copyFile(fromPath, toPath, (copyError: NodeJS.ErrnoException) => {
        if (!copyError) {
            log(`${fromPath} => ${toPath}`);
            resolve();
        } else if (copyError.code === 'ENOENT') {
            const dir = path.resolve(toPath, '../');
            fs.mkdir(dir, {recursive: true}, (mrDirError) => {
                if (!mrDirError) {
                    copyFile(fromPath, toPath).then(() => resolve());
                } else {
                    throw new Error(`Cannot create directory ${dir}: \n ${JSON.stringify(mrDirError)}`);
                }
            });
        } else {
            throw new Error(`Cannot copy from ${fromPath} to ${toPath}: \n ${JSON.stringify(copyError)}`);
        }
    }));
}
