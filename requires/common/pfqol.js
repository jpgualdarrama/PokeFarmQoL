/* globals jQuery GM_addStyle
        Globals Resources Helpers LocalStorageManager DexUtilities DexPageParser
        EvolutionTreeParser DaycarePage FarmPage LabPage PublicFieldsPage
        PrivateFieldsPage  ShelterPage FishingPage MultiuserPage DexPage
        WishforgePage QoLHub */
const pfqol = function ($) {
    'use strict';
    // :contains to case insensitive
    $.extend($.expr[':'], {
        // eslint-disable-next-line no-unused-vars
        'containsIN': function (elem, i, match, array) {
            return (elem.textContent || elem.innerText || '').toLowerCase().indexOf((match[3] || '').toLowerCase()) >= 0;
        }
    });

    const DEFAULT_USER_SETTINGS = { // default settings when the script gets loaded the first time
        customCss: '',
        enableDaycare: true,
        shelterEnable: true,
        fishingEnable: true,
        publicFieldEnable: true,
        privateFieldEnable: true,
        partyMod: true,
        easyEvolve: true,
        labNotifier: true,
        dexFilterEnable: true,
        condenseWishforge: true
    };
    let USER_SETTINGS = DEFAULT_USER_SETTINGS;

    const GLOBALS = Globals;
    const HELPERS = Helpers;
    const RESOURCES = Resources;
    GLOBALS.fillTemplates(RESOURCES);
    GLOBALS.fillOptionsLists(HELPERS);

    // manage GLOBALS.DEX_DATA and GLOBALS.DEX_UPDATE_DATE
    // GLOBALS.DEX_DATA is the data loaded directly from the script contained in
    // the pokefarm.com/dex HTML. It contains the list of pokemon, and for each:
    // - their types
    // - if they hatch from an egg,
    // - if you have the eggdex, and
    // - if you have the regular, shiny, albino, and melanistic pokedex entries
    const LOCAL_STORAGE = new LocalStorageManager(localStorage);
    if (!LOCAL_STORAGE.loadDexIntoGlobalsFromStorage(GLOBALS)) { // can't load it from storage
        LOCAL_STORAGE.loadDexIntoGlobalsFromWeb($, document, DexUtilities, GLOBALS); // so load it from the web
    } else { // can load it from storage
        LOCAL_STORAGE.loadDexIntoGlobalsFromWebIfOld($, document, DexUtilities, GLOBALS); // reload it from web if it's old
    }
    LOCAL_STORAGE.loadEvolveByLevelList(GLOBALS);
    LOCAL_STORAGE.loadEvolutionTreeDepthList(GLOBALS);

    const PFQoL = (function PFQoL() {

        const SETTINGS_SAVE_KEY = GLOBALS.SETTINGS_SAVE_KEY;

        const PAGES = {
            instantiatePages: function () {
                for (const key of Object.keys(PAGES.pages)) {
                    const pg = PAGES.pages[key];
                    if (USER_SETTINGS[pg.setting] === true) {
                        PAGES.pages[key].object = new PAGES.pages[key].class($, GLOBALS, {
                            DexPageParser: DexPageParser
                        });
                    }
                }
            },
            loadSettings: function () {
                for (const key of Object.keys(PAGES.pages)) {
                    const pg = PAGES.pages[key];
                    if (USER_SETTINGS[pg.setting] === true && pg.object.onPage(window)) {
                        pg.object.loadSettings();
                    }
                }
            },
            saveSettings: function () {
                for (const key of Object.keys(PAGES.pages)) {
                    const pg = PAGES.pages[key];
                    if (USER_SETTINGS[pg.setting] === true && pg.object.onPage(window)) {
                        pg.object.saveSettings();
                    }
                }
            },
            populateSettings: function () {
                for (const key of Object.keys(PAGES.pages)) {
                    const pg = PAGES.pages[key];
                    if (USER_SETTINGS[pg.setting] === true && pg.object.onPage(window)) {
                        pg.object.populateSettings();
                    }
                }
            },
            clearPageSettings: function (pageName) {
                if (!(pageName in PAGES.pages)) {
                    console.error(`Could not proceed with clearing page settings. Page ${pageName} not found in list of pages`);
                } else if (PAGES.pages[pageName].object) {
                    PAGES.pages[pageName].object.resetSettings();
                }
            },
            setupHTML: function (GLOBALS) {
                for (const key of Object.keys(PAGES.pages)) {
                    const pg = PAGES.pages[key];
                    if (USER_SETTINGS[pg.setting] === true && pg.object.onPage(window)) {
                        pg.object.setupHTML(GLOBALS);
                        fn.backwork.populateSettingsPage();
                    }
                }
            },
            setupCSS: function () {
                for (const key of Object.keys(PAGES.pages)) {
                    const pg = PAGES.pages[key];
                    if (USER_SETTINGS[pg.setting] === true && pg.object.onPage(window)) {
                        pg.object.setupCSS();
                    }
                }
            },
            setupObservers: function () {
                for (const key of Object.keys(PAGES.pages)) {
                    const pg = PAGES.pages[key];
                    if (USER_SETTINGS[pg.setting] === true && pg.object.onPage(window)) {
                        pg.object.setupObserver();
                    }
                }
            },
            setupHandlers: function (GLOBALS) {
                for (const key of Object.keys(PAGES.pages)) {
                    const pg = PAGES.pages[key];
                    if (USER_SETTINGS[pg.setting] === true && pg.object.onPage(window)) {
                        pg.object.setupHandlers(GLOBALS);
                    }
                }
            },
            settingsChange: function () {
                for (const key of Object.keys(PAGES.pages)) {
                    const pg = PAGES.pages[key];
                    if (USER_SETTINGS[pg.setting] === true && pg.object.onPage(window)) {
                        pg.object.settingsChange();
                    }
                }
            },
            pages: {
                'Daycare': {
                    class: DaycarePage,
                    object: undefined,
                    setting: 'enableDaycare'
                },
                'Farm': {
                    class: FarmPage,
                    object: undefined,
                    setting: 'easyEvolve'
                },
                'Fishing': {
                    class: FishingPage,
                    object: undefined,
                    setting: 'fishingEnable'
                },
                'Lab': {
                    class: LabPage,
                    object: undefined,
                    setting: 'labNotifier'
                },
                'Multiuser': {
                    class: MultiuserPage,
                    object: undefined,
                    setting: 'partyMod'
                },
                'PrivateFields': {
                    class: PrivateFieldsPage,
                    object: undefined,
                    setting: 'privateFieldEnable'
                },
                'PublicFields': {
                    class: PublicFieldsPage,
                    object: undefined,
                    setting: 'publicFieldEnable'
                },
                'Shelter': {
                    class: ShelterPage,
                    object: undefined,
                    setting: 'shelterEnable'
                },
                'Dex': {
                    class: DexPage,
                    object: undefined,
                    setting: 'dexFilterEnable'
                },
                'Wishforge': {
                    class: WishforgePage,
                    object: undefined,
                    setting: 'condenseWishforge'
                },
            }
        };

        const fn = { // all the functions for the script
            /** background stuff */
            backwork: { // background stuff
                instantiatePages() {
                    PAGES.instantiatePages();
                },
                loadSettings() { // initial settings on first run and setting the variable settings key
                    PAGES.loadSettings();
                    if (localStorage.getItem(SETTINGS_SAVE_KEY) === null) {
                        fn.backwork.saveSettings();
                    } else {
                        try {
                            const countScriptSettings = Object.keys(USER_SETTINGS).length;
                            const localStorageString = JSON.parse(localStorage.getItem(SETTINGS_SAVE_KEY));
                            const countLocalStorageSettings = Object.keys(localStorageString).length;
                            // adds new objects (settings) to the local storage
                            if (countLocalStorageSettings < countScriptSettings) {
                                const defaultsSetting = USER_SETTINGS;
                                const userSetting = JSON.parse(localStorage.getItem(SETTINGS_SAVE_KEY));
                                const newSetting = $.extend(true, {}, defaultsSetting, userSetting);

                                USER_SETTINGS = newSetting;
                                fn.backwork.saveSettings();
                            }
                            // removes objects from the local storage if they don't exist anymore. Not yet possible..
                            if (countLocalStorageSettings > countScriptSettings) {
                                //let defaultsSetting = USER_SETTINGS;
                                //let userSetting = JSON.parse(localStorage.getItem(SETTINGS_SAVE_KEY));
                                fn.backwork.saveSettings();
                            }
                        }
                        catch (err) {
                            fn.backwork.saveSettings();
                        }
                        if (localStorage.getItem(SETTINGS_SAVE_KEY) != USER_SETTINGS) {
                            USER_SETTINGS = JSON.parse(localStorage.getItem(SETTINGS_SAVE_KEY));
                        }
                    }
                }, // loadSettings
                saveSettings() { // Save changed settings
                    PAGES.saveSettings();
                    localStorage.setItem(SETTINGS_SAVE_KEY, JSON.stringify(USER_SETTINGS));
                }, // saveSettings
                populateSettingsPage() { // checks all settings checkboxes that are true in the settings
                    for (const key in USER_SETTINGS) {
                        if (Object.hasOwnProperty.call(USER_SETTINGS, key)) {
                            const value = USER_SETTINGS[key];
                            if (typeof value === 'boolean') {
                                HELPERS.toggleSetting(key, value);
                            }
                            else if (typeof value === 'string') {
                                HELPERS.toggleSetting(key, value);
                            }
                        }
                    }
                    PAGES.populateSettings();
                },
                clearPageSettings(pageName) {
                    PAGES.clearPageSettings(pageName);
                },
                setupHTML(GLOBALS) { // injects the HTML changes from GLOBALS.TEMPLATES into the site
                    // Header link to Userscript settings
                    document.querySelector('li[data-name*=\'Lucky Egg\']').insertAdjacentHTML('afterend', GLOBALS.TEMPLATES.qolHubLinkHTML);

                    PAGES.setupHTML(GLOBALS);
                },
                setupCSS() { // All the CSS changes are added here
                    GM_addStyle(RESOURCES.css());
                    PAGES.setupCSS();

                    //custom user css
                    const customUserCss = USER_SETTINGS.customCss;
                    //document.querySelector('head').append();
                    $('head').append('<style type="text/css">' + customUserCss + '</style>');
                },
                setupObservers() { // all the Observers that needs to run
                    PAGES.setupObservers();
                },
                setupHandlers(GLOBALS) { // all the event handlers
                    PAGES.setupHandlers(GLOBALS);
                },
                startup() { // All the functions that are run to start the script on Pokéfarm
                    return {
                        'creating Page handlers': fn.backwork.instantiatePages,
                        'loading Settings': fn.backwork.loadSettings,
                        'setting up HTML': fn.backwork.setupHTML,
                        'populating Settings': fn.backwork.populateSettingsPage,
                        'setting up CSS': fn.backwork.setupCSS,
                        'setting up Observers': fn.backwork.setupObservers,
                        'setting up Handlers': fn.backwork.setupHandlers,
                    };
                },
                init() { // Starts all the functions.
                    console.log('Starting up ..');
                    const startup = fn.backwork.startup();
                    for (const message in startup) {
                        if (Object.hasOwnProperty.call(startup, message)) {
                            console.log(message);
                            startup[message](GLOBALS);
                        }
                    }
                },
            }, // end of backwork

            /** public stuff */
            API: { // the actual seeable and interactable part of the userscript
                settingsChange(element, textElement) {
                    if (JSON.stringify(USER_SETTINGS).indexOf(element) >= 0) { // userscript settings
                        if (USER_SETTINGS[element] === false) {
                            USER_SETTINGS[element] = true;
                        } else if (USER_SETTINGS[element] === true) {
                            USER_SETTINGS[element] = false;
                        } else if (typeof USER_SETTINGS[element] === 'string') {
                            USER_SETTINGS[element] = textElement;
                        }
                        fn.backwork.saveSettings();
                    } else {
                        PAGES.settingsChange();
                    }
                }, // settingsChange

                clearPageSettings(pageName) {
                    if (pageName !== 'None') { // "None" matches option in HTML
                        fn.backwork.clearPageSettings(pageName);
                    }
                }, // clearPageSettings
                populateSettingsPage() {
                    fn.backwork.populateSettingsPage();
                } // populateSettingsPage
            }, // end of API
        }; // end of fn

        fn.backwork.init();

        return fn.API;
    })(); // end of PFQoL function

    $(document).on('click', 'li[data-name="QoL"]', (function () { //open QoL hub
        QoLHub.build($, document, GLOBALS.TEMPLATES, GLOBALS, USER_SETTINGS, PFQoL.settingsChange);
        PFQoL.populateSettingsPage();
    }));

    $(document).on('click', '#updateDex', (function () {
        QoLHub.handleUpdateDexClick($, document, DexUtilities, LOCAL_STORAGE, DexPageParser, EvolutionTreeParser, GLOBALS);
    }));

    $(document).on('click', '#resetPageSettings', (function () {
        const page = $(this).parent().find('select').val();
        PFQoL.clearPageSettings(page);
    }));

    // Issue #61 - Item 6 - Remove the 'Cleared!' message so the user knows they can click it again
    $(document).on('mouseover', '#clearCachedDex', (function () {
        $('#clearCachedDex').next().remove();
    }));

    // Issue #61 - Item 6 - Add a 'Cleared!' message so the user knows that the clearing works
    $(document).on('click', '#clearCachedDex', (function () {
        $('#clearCachedDex').next().remove();
        localStorage.removeItem('QoLEvolveByLevel');
        localStorage.removeItem('QoLDexIDsCache');
        localStorage.removeItem('QoLEvolutionTreeDepth');
        localStorage.removeItem('QoLRegionalFormsList');
        $('#clearCachedDex').after('<span> Cleared!</span>');
    }));

    $(document).on('click', 'h3.slidermenu', (function () { //show hidden li in change log
        $(this).next().slideToggle();
    }));
};

if (module) {
    module.exports.pfqol = pfqol;
}
else {
    pfqol(jQuery);
}