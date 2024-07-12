"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandListProvider = void 0;
const vscode = require("vscode");
class CommandListProvider {
    constructor(fetcher) {
        this.fetcher = fetcher;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return this.getCommandNames();
        }
        console.warn("CommandListProvider: Something is wrong.");
        return [];
    }
    /**
     * Given the path to package.json, read all its dependencies and devDependencies.
     */
    getCommandNames() {
        const xs = this.fetcher.getList().sort();
        const toCommandName = (name) => {
            return new CommandName(name, vscode.TreeItemCollapsibleState.None);
        };
        console.info(`getCommandNames(): xs = ${xs}`);
        return xs.map(toCommandName);
    }
}
exports.CommandListProvider = CommandListProvider;
class CommandName extends vscode.TreeItem {
    constructor(label, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.tooltip = `${this.label}`;
    }
}
//# sourceMappingURL=commandExplorer.js.map