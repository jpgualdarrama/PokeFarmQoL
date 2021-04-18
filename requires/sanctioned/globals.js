/* globals GlobalsBase */
// eslint-disable-next-line no-unused-vars
class Globals extends GlobalsBase {
    constructor(jQuery, localStorageMgr) {
        super();
        this.jQuery = jQuery;
        this.localStorageMgr = localStorageMgr;
    }
    async getDexData() {
        const errorSuppressorKey = 'QoLFetchErrorCount';
        const maxFetchErrorDisplays = 10;
        let errorSuppressorCount = this.localStorageMgr.getItem(errorSuppressorKey);
        if (errorSuppressorCount === null) {
            this.localStorageMgr.setItem(errorSuppressorKey, JSON.stringify(0));
            errorSuppressorCount = 0;
        } else {
            errorSuppressorCount = JSON.parse(errorSuppressorCount);
        }

        // load the dex from local storage if it exists
        if (!this.localStorageMgr.loadDexIntoGlobalsFromStorage(this)) {
            const obj = this;
            return fetch('/dex')
                .then(r => {
                    if (!r.ok) {
                        throw new Error(`Response was not ok. OK=${r.ok}, Status=${r.status}, Text=${r.statusText}`);
                    }
                    return r.text();
                })
                .then(html => {
                    try {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const script = doc.getElementById('dexdata');
                        const json = script.textContent;
                        obj.DEX_DATA = json.split(',');
                        obj.localStorageMgr.updateLocalStorageDex(obj.jQuery, document, undefined, obj);
                        obj.localStorageMgr.loadDexIntoGlobalsFromStorage(obj);
                        errorSuppressorCount = 0;
                        this.localStorageMgr.setItem(errorSuppressorKey, JSON.stringify(0));
                        return obj.DEX_DATA;
                    } catch (error) {
                        if (errorSuppressorCount < maxFetchErrorDisplays) {
                            errorSuppressorCount++;
                            this.localStorageMgr.setItem(errorSuppressorKey, JSON.stringify(errorSuppressorCount));
                            window.alert(`The following error occurred after successful fetching. Please include this message when reporting this issue.\n${error}\n` +
                                `This message will be reported ${maxFetchErrorDisplays - errorSuppressorCount} times before being suppressed`);
                        }
                    }
                })
                .catch(error => {
                    if (errorSuppressorCount < maxFetchErrorDisplays) {
                        errorSuppressorCount++;
                        this.localStorageMgr.setItem(errorSuppressorKey, JSON.stringify(errorSuppressorCount));
                        window.alert(`The following error occurred during fetching. Please include this message when reporting this issue.\n${error}\n` +
                            `This message will be reported ${maxFetchErrorDisplays - errorSuppressorCount} times before being suppressed`);
                    }
                });
        } else {
            return Promise.resolve(this.DEX_DATA);
        }
    }
}
