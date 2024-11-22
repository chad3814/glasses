export function* take<T>(num: number, items: Iterable<T>): Generator<T[]> {
    if (num <= 0) {
        throw new Error('Invalid Parameter: num');
    }
    let ret: T[] = [];
    let i = 0;
    for (const item of items) {
        ret.push(item);
        i++;
        if (i === num) {
            yield ret;
            i = 0;
            ret = [];
        }
    }
    if (ret.length > 0) {
        yield ret;
    }
}

export type TakeUntilTestFn<T> = (items: T[]) => boolean;
export function* takeUntil<T>(testFn: TakeUntilTestFn<T>, items: Iterable<T>): Generator<T[]> {
    let ret: T[] = [];
    for (const item of items) {
        ret.push(item);
        if (testFn(ret)) {
            yield ret;
            ret = [];
        }
    }
    if (ret.length > 0) {
        yield ret;
    }
}
