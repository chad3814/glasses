const STOP_WORDS = ['the', 'and', 'a', 'of', 'in', 'on', 'by'];
const SEPARATOR = /\s+/uig;
const REMOVE = /[^a-z0-9.\s]/uig;
const SPACE = /\s/ui;

export function tokenize(str: string): string[] {
    const tokens = str.toLowerCase()
        .replace(REMOVE, '')
        .replaceAll('.', ' ')
        .split(SEPARATOR)
        .filter(
            token => !STOP_WORDS
                .includes(token.toLowerCase())
                && token !== ''
                && !token.match(SPACE)
    );
    return tokens;
}