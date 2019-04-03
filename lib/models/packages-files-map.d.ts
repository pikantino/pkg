import { PackageFiles } from "./package-files";
export declare class PackagesFilesMap {
    modules: {
        [packageName: string]: PackageFiles;
    };
    globals: {
        [packageName: string]: PackageFiles;
    };
    modulesFolder: string;
    constructor(modules: {
        [packageName: string]: PackageFiles;
    }, globals: {
        [packageName: string]: PackageFiles;
    }, modulesFolder: string);
    isModule(key: string): boolean;
    isGlobal(key: string): boolean;
    resolvePath(lookUpPackage: string): string;
    private isKey;
}
