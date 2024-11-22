const STOP_WORDS = ['the', 'and', 'a', 'of', 'in', 'on'];
const SPACE = /\s/u;
const REMOVE = /[^a-z0-9.\s]/uig;

export function tokenize(str: string): string[] {
    const tokens = str.replace(REMOVE, '').split(SPACE).filter(
        token => !STOP_WORDS.includes(token.toLocaleLowerCase())
    );
    return tokens;
}