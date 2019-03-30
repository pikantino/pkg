import { PackageFiles } from "./package-files";
export declare class PackagesFilesMap {
    map: {
        [packageName: string]: PackageFiles;
    };
    modulesFolder: string;
    constructor(map: {
        [packageName: string]: PackageFiles;
    }, modulesFolder: string);
    resolvePath(lookUpPackage: string): string;
}
