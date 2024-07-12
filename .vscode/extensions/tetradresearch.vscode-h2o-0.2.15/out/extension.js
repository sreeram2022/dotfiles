"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const Parser = require("web-tree-sitter");
const cacheFetcher_1 = require("./cacheFetcher");
const commandExplorer_1 = require("./commandExplorer");
const utils_1 = require("./utils");
const supportedLanguages = ['shellscript', 'bitbake'];
function initializeParser() {
    return __awaiter(this, void 0, void 0, function* () {
        yield Parser.init();
        const parser = new Parser;
        const path = `${__dirname}/../tree-sitter-bash.wasm`;
        const lang = yield Parser.Language.load(path);
        parser.setLanguage(lang);
        return parser;
    });
}
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const parser = yield initializeParser();
        const trees = {};
        const fetcher = new cacheFetcher_1.CachingFetcher(context.globalState);
        yield fetcher.init();
        try {
            yield fetcher.fetchAllCurated("general");
        }
        catch (_a) {
            console.warn("Failed in fetch.fetchAllCurated().");
        }
        const compprovider = vscode.languages.registerCompletionItemProvider(supportedLanguages, {
            provideCompletionItems(document, position, token, context) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!parser) {
                        console.error("[Completion] Parser is unavailable!");
                        return Promise.reject("Parser unavailable!");
                    }
                    if (!trees[document.uri.toString()]) {
                        console.log("[Completion] Creating tree");
                        trees[document.uri.toString()] = parser.parse(document.getText());
                    }
                    const tree = trees[document.uri.toString()];
                    const commandList = fetcher.getList();
                    let compCommands = [];
                    if (!!commandList) {
                        compCommands = commandList.map((s) => new vscode.CompletionItem(s));
                    }
                    // this is an ugly hack to get current Node
                    const p = walkbackIfNeeded(document, tree.rootNode, position);
                    const isCursorTouchingWord = (p === position);
                    console.log(`[Completion] isCursorTouchingWord: ${isCursorTouchingWord}`);
                    try {
                        const cmdSeq = yield getContextCmdSeq(tree.rootNode, p, fetcher);
                        if (!!cmdSeq && cmdSeq.length) {
                            const deepestCmd = cmdSeq[cmdSeq.length - 1];
                            const compSubcommands = getCompletionsSubcommands(deepestCmd);
                            let compOptions = getCompletionsOptions(document, tree.rootNode, p, cmdSeq);
                            let compItems = [
                                ...compSubcommands,
                                ...compOptions,
                            ];
                            if (isCursorTouchingWord) {
                                const currentNode = getCurrentNode(tree.rootNode, position);
                                const currentWord = currentNode.text;
                                compItems = compItems.filter(compItem => (0, utils_1.isPrefixOf)(currentWord, (0, utils_1.getLabelString)(compItem.label)));
                                compItems.forEach(compItem => {
                                    compItem.range = range(currentNode);
                                });
                                console.info(`[Completion] currentWord: ${currentWord}`);
                            }
                            return compItems;
                        }
                        else {
                            throw new Error("unknown command");
                        }
                    }
                    catch (e) {
                        const currentNode = getCurrentNode(tree.rootNode, position);
                        const currentWord = currentNode.text;
                        console.info(`[Completion] currentWord = ${currentWord}`);
                        if (!!compCommands && p === position && currentWord.length >= 2) {
                            console.info("[Completion] Only command completion is available (2)");
                            let compItems = compCommands.filter(cmd => (0, utils_1.isPrefixOf)(currentWord, (0, utils_1.getLabelString)(cmd.label)));
                            compItems.forEach(compItem => {
                                compItem.range = range(currentNode);
                            });
                            return compItems;
                        }
                        console.warn("[Completion] No completion item is available (1)", e);
                        return Promise.reject("Error: No completion item is available");
                    }
                });
            }
        }, ' ');
        const hoverprovider = vscode.languages.registerHoverProvider(supportedLanguages, {
            provideHover(document, position, token) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!parser) {
                        console.error("[Hover] Parser is unavailable!");
                        return Promise.reject("Parser is unavailable!");
                    }
                    if (!trees[document.uri.toString()]) {
                        console.log("[Hover] Creating tree");
                        trees[document.uri.toString()] = parser.parse(document.getText());
                    }
                    const tree = trees[document.uri.toString()];
                    const currentWord = getCurrentNode(tree.rootNode, position).text;
                    try {
                        const cmdSeq = yield getContextCmdSeq(tree.rootNode, position, fetcher);
                        if (!!cmdSeq && cmdSeq.length) {
                            const name = cmdSeq[0].name;
                            if (currentWord === name) {
                                // Display root-level command
                                const clearCacheCommandUri = vscode.Uri.parse(`command:h2o.clearCache?${encodeURIComponent(JSON.stringify(name))}`);
                                const thisCmd = cmdSeq.find((cmd) => cmd.name === currentWord);
                                const tldrText = (0, utils_1.formatTldr)(thisCmd.tldr);
                                const usageText = (0, utils_1.formatUsage)(thisCmd.usage);
                                const descText = (thisCmd.description !== thisCmd.name && !tldrText) ? (0, utils_1.formatDescription)(thisCmd.description) : "";
                                const msg = new vscode.MarkdownString(`\`${name}\`${descText}${usageText}${tldrText}\n\n[Reset](${clearCacheCommandUri})`);
                                msg.isTrusted = true;
                                return new vscode.Hover(msg);
                            }
                            else if (cmdSeq.length > 1 && cmdSeq.some((cmd) => cmd.name === currentWord)) {
                                // Display a subcommand
                                const thatCmd = cmdSeq.find((cmd) => cmd.name === currentWord);
                                const nameSeq = [];
                                for (const cmd of cmdSeq) {
                                    if (cmd.name !== currentWord) {
                                        nameSeq.push(cmd.name);
                                    }
                                    else {
                                        break;
                                    }
                                }
                                const cmdPrefixName = nameSeq.join(" ");
                                const usageText = (0, utils_1.formatUsage)(thatCmd.usage);
                                const msg = `${cmdPrefixName} **${thatCmd.name}**\n\n${thatCmd.description}${usageText}`;
                                return new vscode.Hover(new vscode.MarkdownString(msg));
                            }
                            else if (cmdSeq.length) {
                                const opts = getMatchingOption(currentWord, name, cmdSeq);
                                const msg = optsToMessage(opts);
                                return new vscode.Hover(new vscode.MarkdownString(msg));
                            }
                            else {
                                return Promise.reject(`No hover is available for ${currentWord}`);
                            }
                        }
                    }
                    catch (e) {
                        console.log("[Hover] Error: ", e);
                        return Promise.reject("No hover is available");
                    }
                });
            }
        });
        function updateTree(p, edit) {
            if (edit.document.isClosed || edit.contentChanges.length === 0) {
                return;
            }
            const old = trees[edit.document.uri.toString()];
            if (!!old) {
                for (const e of edit.contentChanges) {
                    const startIndex = e.rangeOffset;
                    const oldEndIndex = e.rangeOffset + e.rangeLength;
                    const newEndIndex = e.rangeOffset + e.text.length;
                    const indices = [startIndex, oldEndIndex, newEndIndex];
                    const [startPosition, oldEndPosition, newEndPosition] = indices.map(i => asPoint(edit.document.positionAt(i)));
                    const delta = { startIndex, oldEndIndex, newEndIndex, startPosition, oldEndPosition, newEndPosition };
                    old.edit(delta);
                }
            }
            const t = p.parse(edit.document.getText(), old);
            trees[edit.document.uri.toString()] = t;
        }
        function edit(edit) {
            updateTree(parser, edit);
        }
        function close(document) {
            console.log("[Close] removing a tree");
            const t = trees[document.uri.toString()];
            if (t) {
                t.delete();
                delete trees[document.uri.toString()];
            }
        }
        // h2o.loadCommand: Download the command `name`
        const loadCommand = vscode.commands.registerCommand('h2o.loadCommand', (name) => __awaiter(this, void 0, void 0, function* () {
            let cmd = name;
            if (!name) {
                cmd = (yield vscode.window.showInputBox({ placeHolder: 'which command?' }));
            }
            if (!cmd || !cmd.trim()) {
                console.info("[h2o.loadCommand] Cancelled operation.");
                return;
            }
            try {
                console.log(`[Command] Downloading ${cmd} data...`);
                yield fetcher.downloadCommandToCache(cmd);
                const msg = `[Shell Completion] Added ${cmd}.`;
                vscode.window.showInformationMessage(msg);
            }
            catch (e) {
                console.error("Error: ", e);
                return Promise.reject(`[h2o.loadCommand] Failed to load ${cmd}`);
            }
        }));
        // h2o.clearCache: Clear cache of the command `name`
        const clearCacheCommand = vscode.commands.registerCommand('h2o.clearCache', (name) => __awaiter(this, void 0, void 0, function* () {
            let cmd = name;
            if (!name) {
                cmd = (yield vscode.window.showInputBox({ placeHolder: 'which command?' }));
            }
            if (!cmd || !cmd.trim()) {
                console.info("[h2o.clearCacheCommand] Cancelled operation.");
                return;
            }
            try {
                console.log(`[h2o.clearCacheCommand] Clearing cache for ${cmd}`);
                yield fetcher.unset(cmd);
                const msg = `[Shell Completion] Cleared ${cmd}`;
                vscode.window.showInformationMessage(msg);
            }
            catch (e) {
                console.error("Error: ", e);
                return Promise.reject("[h2o.clearCacheCommand] Failed");
            }
        }));
        // h2o.loadCommon: Download the package bundle "common"
        const invokeDownloadingCommon = vscode.commands.registerCommand('h2o.loadCommon', () => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('[h2o.loadCommon] Load common CLI data');
                const msg1 = `[Shell Completion] Loading common CLI data...`;
                vscode.window.showInformationMessage(msg1);
                yield fetcher.fetchAllCurated('general', true);
            }
            catch (e) {
                console.error("[h2o.loadCommon] Error: ", e);
                const msg = `[Shell Completion] Error: Failed to load common CLI specs`;
                vscode.window.showInformationMessage(msg);
                return Promise.reject("[h2o.loadCommon] Error: ");
            }
            const msg = `[Shell Completion] Succssfully loaded common CLI specs`;
            vscode.window.showInformationMessage(msg);
        }));
        // h2o.loadBio: Download the command bundle "bio"
        const invokeDownloadingBio = vscode.commands.registerCommand('h2o.loadBio', () => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('[h2o.loadBio] Load Bioinformatics CLI data');
                const msg1 = `[Shell Completion] Loading bioinformatics CLI specs...`;
                vscode.window.showInformationMessage(msg1);
                yield fetcher.fetchAllCurated('bio', true);
            }
            catch (e) {
                console.error("[h2o.loadBio] Error: ", e);
                return Promise.reject("[h2o.loadBio] Failed to load the Bio package");
            }
            const msg = `[Shell Completion] Succssfully loaded bioinformatics CLI specs!`;
            vscode.window.showInformationMessage(msg);
        }));
        // h2o.removeBio: Remove the command bundle "bio"
        const removeBio = vscode.commands.registerCommand('h2o.removeBio', () => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('[h2o.removeBio] Remove Bioinformatics CLI data');
                const msg1 = `[Shell Completion] Removing bioinformatics CLI specs...`;
                vscode.window.showInformationMessage(msg1);
                const names = yield fetcher.fetchList('bio');
                names.forEach((name) => __awaiter(this, void 0, void 0, function* () { return yield fetcher.unset(name); }));
            }
            catch (e) {
                console.error("[h2o.removeBio] Error: ", e);
                return Promise.reject("[h2o.removeBio] Fetch Error: ");
            }
            const msg = `[Shell Completion] Succssfully removed bioinformatics CLI specs!`;
            vscode.window.showInformationMessage(msg);
        }));
        // Command Explorer
        const commandListProvider = new commandExplorer_1.CommandListProvider(fetcher);
        vscode.window.registerTreeDataProvider('registeredCommands', commandListProvider);
        vscode.commands.registerCommand('registeredCommands.refreshEntry', () => commandListProvider.refresh());
        vscode.commands.registerCommand('registeredCommands.removeEntry', (item) => __awaiter(this, void 0, void 0, function* () {
            if (!!item && !!item.label) {
                const name = item.label;
                console.log(`[registeredCommands.removeEntry] Remove ${name}`);
                yield fetcher.unset(name);
                commandListProvider.refresh();
            }
        }));
        context.subscriptions.push(clearCacheCommand);
        context.subscriptions.push(loadCommand);
        context.subscriptions.push(invokeDownloadingCommon);
        context.subscriptions.push(invokeDownloadingBio);
        context.subscriptions.push(removeBio);
        context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(edit));
        context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(close));
        context.subscriptions.push(compprovider);
        context.subscriptions.push(hoverprovider);
    });
}
exports.activate = activate;
// Convert: vscode.Position -> Parser.Point
function asPoint(p) {
    return { row: p.line, column: p.character };
}
// Convert: option -> UI text (string)
function optsToMessage(opts) {
    if (opts.length === 1) {
        const opt = opts[0];
        const namestr = opt.names.map((s) => `\`${s}\``).join(', ');
        const argstr = (!!opt.argument) ? `\`${opt.argument}\`` : "";
        const msg = `${namestr} ${argstr}\n\n ${opt.description}`;
        return msg;
    }
    else {
        // deal with stacked option
        const namestrs = opts.map(opt => opt.names.map((s) => `\`${s}\``).join(', '));
        const messages = opts.map((opt, i) => `${namestrs[i]}\n\n ${opt.description}`);
        const joined = messages.join("\n\n");
        return joined;
    }
}
// --------------- Helper ----------------------
function range(n) {
    return new vscode.Range(n.startPosition.row, n.startPosition.column, n.endPosition.row, n.endPosition.column);
}
// --------------- For Hovers and Completions ----------------------
// Find the deepest node that contains the position in its range.
function getCurrentNode(n, position) {
    if (!(range(n).contains(position))) {
        console.error("Out of range!");
    }
    for (const child of n.children) {
        const r = range(child);
        if (r.contains(position)) {
            return getCurrentNode(child, position);
        }
    }
    return n;
}
// Moves the position left by one character IF position is contained only in the root-node range.
// This is just a workround as you cannot reach command node if you start from
// the position, say, after 'echo '
// [FIXME] Do not rely on such an ugly hack
function walkbackIfNeeded(document, root, position) {
    const thisNode = getCurrentNode(root, position);
    console.debug("[walkbackIfNeeded] thisNode.type: ", thisNode.type);
    if (thisNode.type === ';') {
        console.info("[walkbackIfNeeded] stop at semicolon.");
        return position;
    }
    if (position.character > 0 && thisNode.type !== 'word') {
        console.info("[walkbackIfNeeded] stepping back!");
        return walkbackIfNeeded(document, root, position.translate(0, -1));
    }
    else if (thisNode.type !== 'word' && position.character === 0 && position.line > 0) {
        const prevLineIndex = position.line - 1;
        const prevLine = document.lineAt(prevLineIndex);
        if (prevLine.text.trimEnd().endsWith('\\')) {
            const charIndex = prevLine.text.trimEnd().length - 1;
            return walkbackIfNeeded(document, root, new vscode.Position(prevLineIndex, charIndex));
        }
    }
    return position;
}
// Returns current word as an option if the tree-sitter says so
function getMatchingOption(currentWord, name, cmdSeq) {
    const thisName = currentWord.split('=', 2)[0];
    if (thisName.startsWith('-')) {
        const options = getOptions(cmdSeq);
        const theOption = options.find((x) => x.names.includes(thisName));
        if (theOption) {
            return [theOption];
        }
        else if (isOldStyle(thisName)) {
            // deal with a stacked options like `-xvf`
            // or, a short option immediately followed by an argument, i.e. '-oArgument'
            const shortOptionNames = unstackOption(thisName);
            const shortOptions = shortOptionNames.map(short => options.find(opt => opt.names.includes(short))).filter(opt => opt);
            if (shortOptionNames.length > 1 && shortOptionNames.length === shortOptions.length) {
                return shortOptions; // i.e. -xvf
            }
            else if (shortOptions.length > 0) {
                return [shortOptions[0]]; // i.e. -oArgument
            }
        }
    }
    return [];
}
function isOldStyle(name) {
    return name.startsWith('-') && !name.startsWith('--') && name.length > 2;
}
function unstackOption(name) {
    const xs = name.substring(1).split('').map(c => c.padStart(2, '-'));
    if (!xs.length) {
        return [];
    }
    const ys = new Set(xs);
    if (xs.length !== ys.size) {
        // if characters are NOT unique like -baba
        // then it returns ['-b'] assuming 'aba' is the argument
        return [xs[0]];
    }
    return xs;
}
// Get command node inferred from the current position
function _getContextCommandNode(root, position) {
    var _a, _b;
    let currentNode = getCurrentNode(root, position);
    if (((_a = currentNode.parent) === null || _a === void 0 ? void 0 : _a.type) === 'command_name') {
        currentNode = currentNode.parent;
    }
    if (((_b = currentNode.parent) === null || _b === void 0 ? void 0 : _b.type) === 'command') {
        return currentNode.parent;
    }
}
// Get command name covering the position if exists
function getContextCommandName(root, position) {
    var _a, _b, _c;
    // if you are at a command, a named node, the currentNode becomes one-layer deeper than other nameless nodes.
    const commandNode = _getContextCommandNode(root, position);
    let name = (_a = commandNode === null || commandNode === void 0 ? void 0 : commandNode.firstNamedChild) === null || _a === void 0 ? void 0 : _a.text;
    if (name === 'sudo' || name === 'nohup') {
        name = (_c = (_b = commandNode === null || commandNode === void 0 ? void 0 : commandNode.firstNamedChild) === null || _b === void 0 ? void 0 : _b.nextSibling) === null || _c === void 0 ? void 0 : _c.text;
    }
    return name;
}
// Get subcommand names NOT starting with `-`
// [FIXME] this catches option's argument; use database instead
function _getSubcommandCandidates(root, position) {
    const candidates = [];
    let commandNode = _getContextCommandNode(root, position);
    if (commandNode) {
        let n = commandNode === null || commandNode === void 0 ? void 0 : commandNode.firstNamedChild;
        while (n === null || n === void 0 ? void 0 : n.nextSibling) {
            n = n === null || n === void 0 ? void 0 : n.nextSibling;
            if (!n.text.startsWith('-')) {
                candidates.push(n.text);
            }
        }
    }
    return candidates;
}
// Get command and subcommand inferred from the current position
function getContextCmdSeq(root, position, fetcher) {
    return __awaiter(this, void 0, void 0, function* () {
        let name = getContextCommandName(root, position);
        if (!name) {
            return Promise.reject("[getContextCmdSeq] Command name not found.");
        }
        try {
            let command = yield fetcher.fetch(name);
            const seq = [command];
            if (!!command) {
                const words = _getSubcommandCandidates(root, position);
                let found = true;
                while (found && !!command.subcommands && command.subcommands.length) {
                    found = false;
                    const subcommands = getSubcommandsWithAliases(command);
                    for (const word of words) {
                        for (const subcmd of subcommands) {
                            if (subcmd.name === word) {
                                command = subcmd;
                                seq.push(command);
                                found = true;
                            }
                        }
                    }
                }
            }
            return seq;
        }
        catch (e) {
            console.error("[getContextCmdSeq] Error: ", e);
            return Promise.reject("[getContextCmdSeq] unknown command!");
        }
    });
}
// Get command arguments as string[]
function getContextCmdArgs(document, root, position) {
    var _a;
    const p = walkbackIfNeeded(document, root, position);
    let node = (_a = _getContextCommandNode(root, p)) === null || _a === void 0 ? void 0 : _a.firstNamedChild;
    if ((node === null || node === void 0 ? void 0 : node.text) === 'sudo' || (node === null || node === void 0 ? void 0 : node.text) === 'nohup') {
        node = node.nextSibling;
    }
    const res = [];
    while (node === null || node === void 0 ? void 0 : node.nextSibling) {
        node = node.nextSibling;
        let text = node.text;
        // --option=arg
        if (text.startsWith('--') && text.includes('=')) {
            text = text.split('=', 2)[0];
        }
        res.push(text);
    }
    return res;
}
// Get subcommand completions
function getCompletionsSubcommands(deepestCmd) {
    const subcommands = getSubcommandsWithAliases(deepestCmd);
    if (subcommands && subcommands.length) {
        const compitems = subcommands.map((sub, idx) => {
            const item = createCompletionItem(sub.name, sub.description);
            item.sortText = `33-${idx.toString().padStart(4)}`;
            return item;
        });
        return compitems;
    }
    return [];
}
// Get option completion
function getCompletionsOptions(document, root, position, cmdSeq) {
    const args = getContextCmdArgs(document, root, position);
    const compitems = [];
    const options = getOptions(cmdSeq);
    options.forEach((opt, idx) => {
        // suppress already-used options
        if (opt.names.every(name => !args.includes(name))) {
            opt.names.forEach(name => {
                const item = createCompletionItem(name, opt.description);
                item.sortText = `55-${idx.toString().padStart(4)}`;
                if (opt.argument) {
                    const snippet = `${name} \$\{1:${opt.argument}\}`;
                    item.insertText = new vscode.SnippetString(snippet);
                }
                compitems.push(item);
            });
        }
    });
    return compitems;
}
function createCompletionItem(label, desc) {
    return new vscode.CompletionItem({ label: label, description: desc });
}
// Get options including inherited ones
function getOptions(cmdSeq) {
    const inheritedOptionsArray = cmdSeq.map(x => (!!x.inheritedOptions) ? x.inheritedOptions : []);
    const deepestCmd = cmdSeq[cmdSeq.length - 1];
    const options = (!!deepestCmd && !!deepestCmd.options) ? deepestCmd.options.concat(...inheritedOptionsArray) : [];
    return options;
}
// Get subcommands including aliases of a subcommands
function getSubcommandsWithAliases(cmd) {
    const subcommands = cmd.subcommands;
    if (!subcommands) {
        return [];
    }
    const res = [];
    for (let subcmd of subcommands) {
        res.push(subcmd);
        if (!!subcmd.aliases) {
            for (const alias of subcmd.aliases) {
                const aliasCmd = Object.assign({}, subcmd);
                aliasCmd.name = alias;
                aliasCmd.description = `(Alias of ${subcmd.name}) `.concat(aliasCmd.description);
                res.push(aliasCmd);
            }
        }
    }
    return res;
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map