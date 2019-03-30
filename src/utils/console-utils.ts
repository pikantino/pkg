const debug = false;

export function log(...args) {
    if (debug) {
        console.log.apply(console, args);
    }
}

export function error(...args) {
    console.log.apply(console, args);
}
