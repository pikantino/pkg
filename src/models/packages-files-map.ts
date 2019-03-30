import {PackageFiles} from "./package-files";
import * as path from 'path';
import * as fs from 'fs';

export class PackagesFilesMap {
    constructor(public map: { [packageName: string]: PackageFiles },
                public modulesFolder: string) {
    }

    public resolvePath(lookUpPackage: string): string {
        const packageName = Object.keys(this.map).find((knownPackage) =>
            lookUpPackage === knownPackage ||
            lookUpPackage.startsWith(knownPackage + '/'));

        if (!packageName) {
            return lookUpPackage + '.js';
        }

        if (lookUpPackage === packageName) {
            return this.modulesFolder + path.join(lookUpPackage, this.map[packageName].entry);
        }

        const subModule = lookUpPackage.slice(packageName.length + 1);
        const subModulePath = path.join(this.map[packageName].folder, subModule);

        if (fs.existsSync(subModulePath + '.js')) {
            return this.modulesFolder + lookUpPackage + '.js';
        }
        if (fs.statSync(subModulePath).isDirectory()) {
            const subModuleIndexPath = path.join(subModulePath, 'index.js');
            if (fs.existsSync(subModuleIndexPath)) {
                return this.modulesFolder + lookUpPackage + '/index.js';
            }
        }

        throw new Error(`${lookUpPackage} has no import mapping`);
    }
}
