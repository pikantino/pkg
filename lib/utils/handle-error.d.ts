/// <reference types="node" />
export declare function handleError<T>(error: NodeJS.ErrnoException | Error, message: string, returningValue?: T): T | never;
