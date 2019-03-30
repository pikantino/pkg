export function getFileName(filePath: string): string {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
}
