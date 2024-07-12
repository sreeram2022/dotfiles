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
exports.CachingFetcher = exports.runH2o = void 0;
const vscode = require("vscode");
const child_process_1 = require("child_process");
const node_fetch_1 = require("node-fetch");
const pako = require("pako");
let neverNotifiedError = true;
class HTTPResponseError extends Error {
    constructor(res) {
        super(`HTTP Error Response: ${res.status} ${res.statusText}`);
        this.response = res;
    }
}
// -----
// Call H2O executable and get command information from the local environment
function runH2o(name) {
    let h2opath = vscode.workspace.getConfiguration('shellCompletion').get('h2oPath');
    if (h2opath === '<bundled>') {
        if (process.platform === 'linux') {
            h2opath = `${__dirname}/../bin/h2o-x86_64-unknown-linux`;
        }
        else if (process.platform === 'darwin') {
            h2opath = `${__dirname}/../bin/h2o-x86_64-apple-darwin`;
        }
        else {
            if (neverNotifiedError) {
                const msg = "Bundled help scanner (H2O) supports Linux and MacOS. Please set the H2O path.";
                vscode.window.showErrorMessage(msg);
            }
            neverNotifiedError = false;
            return;
        }
    }
    const wrapperPath = `${__dirname}/../bin/wrap-h2o`;
    console.log(`[CacheFetcher.runH2o] spawning h2o: ${name}`);
    const proc = (0, child_process_1.spawnSync)(wrapperPath, [h2opath, name], { encoding: "utf8" });
    if (proc.status !== 0) {
        console.log(`[CacheFetcher.runH2o] H2O raises error for ${name}`);
        return;
    }
    console.log(`[CacheFetcher.runH2o] proc.status = ${proc.status}`);
    const out = proc.stdout;
    if (out) {
        const command = JSON.parse(out);
        if (command) {
            console.log(`[CacheFetcher.runH2o] Got command output: ${command.name}`);
            return command;
        }
        else {
            console.warn('[CacheFetcher.runH2o] Failed to parse H2O result as JSON:', name);
        }
    }
    else {
        console.warn('[CacheFetcher.runH2o] Failed to get H2O output:', name);
    }
}
exports.runH2o = runH2o;
// -----
// CachingFetcher manages the local cache using Memento.
// It also pulls command data from the remote repository.
class CachingFetcher {
    constructor(memento) {
        this.memento = memento;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = this.getList();
            if (!existing || !existing.length || existing.length === 0) {
                console.log(">>>---------------------------------------");
                console.log("  Clean state");
                console.log("<<<---------------------------------------");
            }
            else {
                console.log(">>>---------------------------------------");
                console.log("  Memento entries already exist");
                console.log("    # of command specs in the local DB:", existing.length);
                console.log("<<<---------------------------------------");
            }
        });
    }
    // Get Memento key of the command `name`
    static getKey(name) {
        return CachingFetcher.keyPrefix + name;
    }
    // Get Memento data of the command `name`
    getCache(name) {
        const key = CachingFetcher.getKey(name);
        return this.memento.get(key);
    }
    // Update Memento record and the name list
    // Pass undefined to remove the value.
    updateCache(name, command, logging = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (logging) {
                console.log(`[CacheFetcher.update] Updating ${name}...`);
                const t0 = new Date();
                const key = CachingFetcher.getKey(name);
                yield this.memento.update(key, command);
                const t1 = new Date();
                const diff = t1.getTime() - t0.getTime();
                console.log(`[CacheFetcher.update] ${name}: Memento update took ${diff} ms.`);
            }
            else {
                const key = CachingFetcher.getKey(name);
                yield this.memento.update(key, command);
            }
        });
    }
    // Get command data from cache first, then run H2O if fails.
    fetch(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (name.length < 2) {
                return Promise.reject(`Command name too short: ${name}`);
            }
            let cached = this.getCache(name);
            if (cached) {
                console.log('[CacheFetcher.fetch] Fetching from cache:', name);
                return cached;
            }
            console.log('[CacheFetcher.fetch] Fetching from H2O:', name);
            try {
                const command = runH2o(name);
                if (!command) {
                    console.warn(`[CacheFetcher.fetch] Failed to fetch command ${name} from H2O`);
                    return Promise.reject(`Failed to fetch command ${name} from H2O`);
                }
                try {
                    this.updateCache(name, command, true);
                }
                catch (e) {
                    console.log("Failed to update:", e);
                }
                return command;
            }
            catch (e) {
                console.log("[CacheFetcher.fetch] Error: ", e);
                return Promise.reject(`[CacheFetcher.fetch] Failed in CacheFetcher.update() with name = ${name}`);
            }
        });
    }
    // Download the package bundle `kind` and load them to cache
    fetchAllCurated(kind = 'general', isForcing = false) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("[CacheFetcher.fetchAllCurated] Started running...");
            const url = `https://github.com/yamaton/h2o-curated-data/raw/main/${kind}.json.gz`;
            const checkStatus = (res) => {
                if (res.ok) {
                    return res;
                }
                else {
                    throw new HTTPResponseError(res);
                }
            };
            let response;
            try {
                response = yield (0, node_fetch_1.default)(url);
                checkStatus(response);
            }
            catch (error) {
                try {
                    const err = error;
                    const errorBody = yield err.response.text();
                    console.error(`Error body: ${errorBody}`);
                    return Promise.reject("Failed to fetch HTTP response.");
                }
                catch (e) {
                    console.error('Error ... even failed to fetch error body:', e);
                    return Promise.reject("Failed to fetch over HTTP");
                }
            }
            console.log("[CacheFetcher.fetchAllCurated] received HTTP response");
            let commands = [];
            try {
                const s = yield response.buffer();
                const decoded = pako.inflate(s, { to: 'string' });
                commands = JSON.parse(decoded);
            }
            catch (err) {
                console.error("[fetchAllCurated] Error: ", err);
                return Promise.reject("Failed to inflate and parse the content as JSON.");
            }
            console.log("[CacheFetcher.fetchAllCurated] Done inflating and parsing. Command #:", commands.length);
            for (const cmd of commands) {
                const key = CachingFetcher.getKey(cmd.name);
                if (isForcing || this.getCache(cmd.name) === undefined) {
                    this.updateCache(cmd.name, cmd, false);
                }
            }
        });
    }
    // Download the command `name` from the remote repository
    downloadCommandToCache(name, kind = 'experimental') {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[CacheFetcher.downloadCommand] Started getting ${name} in ${kind}...`);
            const url = `https://raw.githubusercontent.com/yamaton/h2o-curated-data/main/${kind}/json/${name}.json`;
            const checkStatus = (res) => {
                if (res.ok) {
                    return res;
                }
                else {
                    throw new HTTPResponseError(res);
                }
            };
            let response;
            try {
                response = yield (0, node_fetch_1.default)(url);
                checkStatus(response);
            }
            catch (error) {
                try {
                    const err = error;
                    const errorBody = yield err.response.text();
                    console.error(`Error body: ${errorBody}`);
                    return Promise.reject("Failed to fetch HTTP response.");
                }
                catch (e) {
                    console.error('Error ... even failed to fetch error body:', e);
                    return Promise.reject("Failed to fetch over HTTP");
                }
            }
            console.log("[CacheFetcher.downloadCommand] received HTTP response");
            let cmd;
            try {
                const content = yield response.text();
                cmd = JSON.parse(content);
            }
            catch (err) {
                const msg = `[CacheFetcher.downloadCommand] Error: ${err}`;
                console.error(msg);
                return Promise.reject(msg);
            }
            console.log(`[CacheFetcher.downloadCommand] Loading: ${cmd.name}`);
            this.updateCache(cmd.name, cmd, true);
        });
    }
    // Get a list of the command bundle `kind`.
    // This is used for removal of bundled commands.
    fetchList(kind = 'bio') {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("[CacheFetcher.fetchList] Started running...");
            const url = `https://raw.githubusercontent.com/yamaton/h2o-curated-data/main/${kind}.txt`;
            const checkStatus = (res) => {
                if (res.ok) {
                    return res;
                }
                else {
                    throw new HTTPResponseError(res);
                }
            };
            let response;
            try {
                response = yield (0, node_fetch_1.default)(url);
                checkStatus(response);
            }
            catch (error) {
                try {
                    const err = error;
                    const errorBody = yield err.response.text();
                    console.error(`Error body: ${errorBody}`);
                    return Promise.reject("Failed to fetch HTTP response.");
                }
                catch (e) {
                    console.error('Error ... even failed to fetch error body:', e);
                    return Promise.reject("Failed to fetch over HTTP");
                }
            }
            console.log("[CacheFetcher.fetchList] received HTTP response");
            let names = [];
            try {
                const content = yield response.text();
                names = content.split(/\r?\n/).map((str) => str.trim()).filter(s => !!s && s.length > 0);
            }
            catch (err) {
                const msg = `[CacheFetcher.fetchList] Error: ${err}`;
                console.error(msg);
                return Promise.reject(msg);
            }
            names.forEach((name) => console.log("    Received ", name));
            return names;
        });
    }
    // Unset cache data of command `name` by assigning undefined
    unset(name) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updateCache(name, undefined);
            console.log(`[CacheFetcher.unset] Unset ${name}`);
        });
    }
    // Load a list of registered commands from Memento
    getList() {
        const keys = this.memento.keys();
        const prefix = CachingFetcher.keyPrefix;
        const cmdKeys = keys.filter(x => x.startsWith(prefix))
            .map(x => x.substring(prefix.length));
        return cmdKeys;
    }
}
exports.CachingFetcher = CachingFetcher;
CachingFetcher.keyPrefix = 'h2oFetcher.cache.';
CachingFetcher.commandListKey = 'h2oFetcher.registered.all';
//# sourceMappingURL=cacheFetcher.js.map