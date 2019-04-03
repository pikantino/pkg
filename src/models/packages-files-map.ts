import * as path from 'path';
import * as fs from 'fs';

import {PackageFiles} from "./package-files";

export class PackagesFilesMap {
    constructor(public modules: { [packageName: string]: PackageFiles },
                public globals: { [packageName: string]: PackageFiles },
                public modulesFolder: string) {
    }

    public isModule(key: string): boolean {
        return this.isKey(key, this.modules);
    }

    public isGlobal(key: string): boolean {
        return this.isKey(key, this.globals);
    }

    public resolvePath(lookUpPackage: string): string {
        const packageName = Object.keys(this.modules).find((knownPackage) =>
            lookUpPackage === knownPackage ||
            lookUpPackage.startsWith(knownPackage + '/'));

        if (!packageName) {
            return lookUpPackage + '.js';
        }

        if (lookUpPackage === packageName) {
            return this.modulesFolder + path.join(lookUpPackage, this.modules[packageName].entry);
        }

        const subModule = lookUpPackage.slice(packageName.length + 1);
        const subModulePath = path.join(this.modules[packageName].folder, subModule);

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

    private isKey(key: string, map: { [packageName: string]: PackageFiles }): boolean {
        return Object.keys(map).some((moduleKey: string) =>
            key.startsWith(moduleKey));
    }
}
