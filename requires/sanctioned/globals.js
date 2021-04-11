/* globals GlobalsBase */
// eslint-disable-next-line no-unused-vars
class Globals extends GlobalsBase {
    constructor(localStorageMgr) {
        super();
        this.localStorageMgr = localStorageMgr;

        // load the dex from local storage if it exists
        if (!this.localStorageMgr.loadDexIntoGlobalsFromStorage(this)) {
            const obj = this;
            // fetch the initial dex data from the /dex page
            fetch('/dex')
                .then(r => {
                    const html = r.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const script = doc.getElementById('dexdata');
                    const json = JSON.parse(script.textContent);
                    obj.DEX_DATA = json;
                    obj.localStorageMgr.updateLocalStorageDex(obj.jQuery, document, undefined, obj);
                });
        }
    }
}