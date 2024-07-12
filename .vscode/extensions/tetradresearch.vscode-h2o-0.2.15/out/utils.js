"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLabelString = exports.isPrefixOf = exports.formatDescription = exports.formatUsage = exports.formatTldr = void 0;
// Format tldr pages by cleaning tldr-specific notations {{path/to/file}}
// as well as removing the title starting with '#'.
function formatTldr(text) {
    if (!text || !text.length) {
        return "";
    }
    const s = text.replace(/{{(.*?)}}/g, "$1");
    const formatted = s
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("#"))
        .map(line => line.replace(/^`(.*)`$/gi, '  ```\n  $1\n  ```\n'))
        .map(line => line.replace(/^\> /gi, '\n'))
        .join("\n")
        .trimStart();
    return `\n\n${formatted}`;
}
exports.formatTldr = formatTldr;
// Format usage
function formatUsage(text) {
    if (!text || !text.trim().length) {
        return "";
    }
    const trimmed = text.trim();
    const xs = trimmed.split("\n");
    const formatted = `Usage:\n\n${xs.map(x => '     ' + x).join("\n")}\n\n`;
    return `\n\n${formatted}`;
}
exports.formatUsage = formatUsage;
// Format description
function formatDescription(text) {
    const trimmed = text.trim();
    return `\n\n${trimmed}`;
}
exports.formatDescription = formatDescription;
// check if string a is prefix of b
function isPrefixOf(left, right) {
    const lengthLeft = left.length;
    const lengthRight = right.length;
    if (lengthLeft > lengthRight) {
        return false;
    }
    return (left === right.substring(0, lengthLeft));
}
exports.isPrefixOf = isPrefixOf;
// get a string from CompletionItem.label type
function getLabelString(compItemLabel) {
    return (typeof compItemLabel === 'string') ? compItemLabel : compItemLabel.label;
}
exports.getLabelString = getLabelString;
//# sourceMappingURL=utils.js.map