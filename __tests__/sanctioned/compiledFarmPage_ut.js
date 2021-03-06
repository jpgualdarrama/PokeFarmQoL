const $ = require('../../__mocks__/jquery_files').jQuery;
$.USERID = '';
const key = `${$.USERID}.QoLFarm`;
const dexKey = `${$.USERID}.QoLPokedex`;
// eslint-disable-next-line no-unused-vars
const console = require('../../__mocks__/console_suppress').console;
const fs = require('fs');
const path = require('path');
const appRoot = require('app-root-path');
const pfqol = require(appRoot + '/Poke-Farm-QoL.sanctioned.test.user');
const oldWindowLocation = window.location;

const TYPES_LIST = [
    'Normal', 'Fire', 'Water', 'Electric',
    'Grass', 'Ice', 'Fighting', 'Poison',
    'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Dark',
    'Steel', 'Fairy',
];
const initialFarmSettings = {
    TYPE_APPEND: {
        NORMAL:'.0',
        FIRE:'.1',
        WATER:'.2',
        ELECTRIC:'.3',
        GRASS:'.4',
        ICE:'.5',
        FIGHTING:'.6',
        POISON:'.7',
        GROUND:'.8',
        FLYING:'.9',
        PSYCHIC:'.10',
        BUG:'.11',
        ROCK:'.12',
        GHOST:'.13',
        DRAGON:'.14',
        DARK:'.15',
        STEEL:'.16',
        FAIRY:'.17',
        NONE:'.18',
    },
    KNOWN_EXCEPTIONS: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/', 'knownExceptions.json'), 'utf8', 'r'))
};

function internalTrim(jObj) {
    // trim self
    const re = RegExp('>(.*?)<', 'g');
    for (let i = 0; i < jObj.length; i++) {
        const currentHTML = jObj.eq(i).html().trim();
        if (currentHTML.length) {
            let textBetweenTags;
            if (re.test(currentHTML)) {
                while ((textBetweenTags = re.exec(currentHTML)) !== null) {
                    const [tagAndText, justText] = textBetweenTags;
                    const htmlBeforeText = currentHTML.substring(0, textBetweenTags.index + 1);
                    const textTrimmed = justText.replace(/\s{1,}/g, ' ').trim();
                    const htmlAfterText = currentHTML.substring(textBetweenTags.index + tagAndText.length - 1);
                    const newHTML = (htmlBeforeText + textTrimmed + htmlAfterText).trim();
                    jObj.eq(i).html(newHTML);
                }
            }
            else {
                jObj.eq(i).html(currentHTML.replace(/\s{1,}/g, ' ').trim());
            }
        }
    }
    // trim children
    for (let j = 0; j < jObj.length; j++) {
        internalTrim(jObj.eq(j).children());
    }
}

function removeComments(jObj) {
    for (let i = 0; i < jObj.length; i++) {
        if (jObj[i].nodeType === Node.COMMENT_NODE) {
            jObj.eq(i).remove();
        }
    }

    if (jObj.length) {
        removeComments(jObj.contents());
    }
}

function internalStringTrim(currentHTML) {
    // trim self
    const startsWithTextBeforeElement = /^([^>]*?)</s;
    const endsWithTextAfterElement = />([^<]*?)$/s;
    const hasTextBetweenElements = RegExp('>(.*?)<', 'sg');
    if (currentHTML.length) {
        let newHTML = '';
        let textBetweenTags;
        let lastIndex = 0;
        // before elements
        if (((textBetweenTags = startsWithTextBeforeElement.exec(currentHTML)) !== null) &&
            textBetweenTags[1] !== '') {
            const justText = textBetweenTags[1];
            const textTrimmed = justText.replace(/\s{1,}/g, ' ').trim();
            newHTML += currentHTML.substring(lastIndex, textBetweenTags.index);
            newHTML += `${textTrimmed}<`;
            lastIndex = textBetweenTags[0].length;
        }
        // between elements
        while ((textBetweenTags = hasTextBetweenElements.exec(currentHTML)) !== null) {
            const justText = textBetweenTags[1];
            const textTrimmed = justText.replace(/\s{1,}/g, ' ').trim();
            newHTML += currentHTML.substring(lastIndex, textBetweenTags.index);
            newHTML += `>${textTrimmed}<`;
            lastIndex = hasTextBetweenElements.lastIndex;
        }
        // after elements
        if (((textBetweenTags = endsWithTextAfterElement.exec(currentHTML)) !== null) &&
            textBetweenTags[1] !== '') {
            const justText = textBetweenTags[1];
            const textTrimmed = justText.replace(/\s{1,}/g, ' ').trim();
            newHTML += currentHTML.substring(lastIndex, textBetweenTags.index);
            newHTML += `>${textTrimmed}`;
            lastIndex = currentHTML.length;
        }

        if (!newHTML) {
            return currentHTML.replace(/\s{1,}/g, ' ').trim();
        }
        else {
            newHTML += currentHTML.substring(lastIndex);
            return newHTML.replace(/\s{1,}/g, ' ').trim();
        }
    }
    return currentHTML.trim();
}

// extend jQuery with recursive HTML equality function
$.fn.equivalent = function (compareTo) {
    if (!compareTo || this.length != compareTo.length) {
        const msg = `Length of object (${this.length}) is not equal to the length of the comparison object (${compareTo.length})`;
        return [false, msg];
    }
    for (let i = 0; i < this.length; ++i) {
        const [status, message] = $(this[i]).children().equivalent($(compareTo[i]).children());
        if (!status) {
            const msg = `${message}\nRecursive call to equivalent() failed`;
            return [false, msg];
        }
    }
    for (let i = 0; i < this.length; ++i) {
        /* use a "fuzzy" equivalency by removing extraneous whitespace that
           doesn't actually affect the structure of the HTML */
        const actual = $(this[i]);
        const expected = $(compareTo[i]);
        const actualHTML = internalStringTrim(actual.html());
        const expectedHTML = internalStringTrim(expected.html());
        if (actualHTML !== expectedHTML) {
            const msg = `The following HTML strings were not equal:\n\tThis object's HTML: ${actualHTML}\n\tComparison object's HTML:${expectedHTML}`;
            return [false, msg];
        }
    }
    return [true];
};

// extend jQuery with recursive node equality function
$.fn.equals = function (compareTo) {
    if (!compareTo || this.length != compareTo.length) {
        return false;
    }
    for (let i = 0; i < this.length; ++i) {
        if (this[i] !== compareTo[i]) {
            return false;
        }
    }
    for (let i = 0; i < this.length; ++i) {
        if (!$(this[i]).children().equals($(compareTo[i]).children())) {
            return false;
        }
    }
    return true;
};

function buildSortedOnTypeFarmEntry(type, typeIndex, lisHTML, isLastEntry) {
    /* Example of empty list:
    <li class="expandlist" hidden="">
        <h3 class="slidermenu">Dragon</h3>
        <ul class="Dragon 14 qolChangeLogContent">
        </ul>
    </li><br hidden="">

    Example of non-empty list
    <li class="expandlist">
        <h3 class="slidermenu">Dark (16)</h3>
        <ul class="Dark 15 qolChangeLogContent">
            <li> ... </li>
            <li> ... </li>
            ...
        </ul>
    </li><br> */
    isLastEntry = isLastEntry || false;

    let html;
    const typeClass = (type === 'Normal' ? 'normal' : (type === 'Unknown Types' ? 'Unknown' : type));
    if (lisHTML.length == 0) {
        html = '<li class="expandlist" hidden="">' +
        `<h3 class="slidermenu">${type}</h3>`;
    } else {
        html = '<li class="expandlist">' +
        `<h3 class="slidermenu">${type} (${lisHTML.length})</h3>`;
    }
    html += `<ul class="${typeClass} ${typeIndex} qolChangeLogContent">`;
    for (let i = 0; i < lisHTML.length; i++) {
        html += lisHTML[i];
    }
    html += '</ul>';

    if(!isLastEntry) {
        if (lisHTML.length == 0) {
            html += '</li><br hidden="">';
        } else {
            html += '</li><br>';
        }
    }
    return html;
}

function isPokefarmFakemon(dex, id) {
    // eslint-disable-next-line no-useless-escape
    const pfqRegionMarkers = ['\\"97\\"', '\\"98\\"', '\\"99\\"'];
    const markerIndices = pfqRegionMarkers.map((marker) => dex.indexOf(marker));

    const idIndex = dex.indexOf(id);

    return markerIndices.some((index) => idIndex > index);
}

beforeAll(() => {
    delete window.location;

    window.location = Object.defineProperties(
        {},
        {
            ...Object.getOwnPropertyDescriptors(oldWindowLocation),
            href: {
                writable: true,
                value: 'fdsa'
            },
            assign: {
                configurable: true,
                value: jest.fn(),
            },
        },
    );
});

function buildHTMLFarmEntry(source, target, gender, summaryID) {
    /* <li><span><a class="summarylink" draggable="false"
                                 href="/summary/FT9_z">Nickit</a><img
                                 src="https://pfq-static.com/img/pkmn/gender_m.png/t=1401213006"
                                 title="[M]"></span> <span class="canevolve small">can <span
                                 class="autoevo">evolve</span> into</span> Thievul</li> */
    const genderImg = (gender === 'M') ? '<img src="https://pfq-static.com/img/pkmn/gender_m.png/t=1401213006" title="[M]"></img>' :
        (gender === 'F') ? '<img src="https://pfq-static.com/img/pkmn/gender_f.png/t=1401213007" title="[F]"></img>' :
            (gender === 'N') ? '<img src="https://pfq-static.com/img/pkmn/gender_n.png/t=1401213004" title="[N]"></img>' :
                undefined;
    if (!genderImg) {
        throw new Error(`Unable to identify gender from string ${gender}`);
    }

    return `<li><span><a class="summarylink" draggable="false" href="/summary/${summaryID}">${source}</a>` +
    `${genderImg}</span>` +
    `<span class="canevolve small">can <span class="autoevo">evolve</span> into</span> ${target}</li>`;
}

function getSummaryUID(json, sourceID, sourceName, targetID, targetName) {
    const key = `FT_${sourceID}_${sourceName}_${targetID}_${targetName}`;
    const uid = json[key];

    if(uid === undefined) {
        throw new Error(`Unable to find summary ID for the following key: ${key}`);
    }
    return uid;
}

describe('Test Farm Page', () => {
    it('Should be setup correctly', () => {
        const htmlpath = path.join(__dirname, '../data/', 'farm.html');
        const html = fs.readFileSync(htmlpath, 'utf8', 'r');
        const innerHTML = html.replace(/<html .*?>/, '').replace(/<\/html>/, '').trim();
        global.location.href = 'https://pokefarm.com/farm#tab=1';
        document.documentElement.innerHTML = innerHTML;

        new pfqol.pfqol($);

        expect($('.qolsortnormal').length).toBe(1);
        expect($('.qolsorttype').length).toBe(1);
        expect($('.qolsortname').length).toBe(1);
        expect($('.qolsortnew').length).toBe(1);
    });

    it('Should show normal list when "Normal list" is clicked', () => {
        const htmlpath = path.join(__dirname, '../data/', 'farm.html');
        const html = fs.readFileSync(htmlpath, 'utf8', 'r');
        const innerHTML = html.replace(/<html .*?>/, '').replace(/<\/html>/, '').trim();
        global.location.href = 'https://pokefarm.com/farm#tab=1';
        document.documentElement.innerHTML = innerHTML;

        // load pokedex
        const dexPath = path.join(__dirname, '../data/', 'dex.json');
        const dex = fs.readFileSync(dexPath, 'utf8', 'r');

        localStorage.setItem(dexKey, dex);
        localStorage.setItem(key, JSON.stringify(initialFarmSettings));

        new pfqol.pfqol($);

        const htmlBefore = $('#farmnews-evolutions .scrollable').html();

        /* need to modify the list in order to show that it goes back to normal
           trigger '#qolsortevolvename' click handler */
        $('#qolsortevolvename').trigger('click');

        // trigger '#qolevolvenormal' click handler
        $('#qolevolvenormal').trigger('click');

        /* there is an inconsequential difference between the HTML before and after:
           the <ul> item has an empty style attribute (i.e., 'style=""')
           remove the empty attribute from the after HTML */
        const htmlAfter = $('#farmnews-evolutions .scrollable').html().replace(' style=""', '');

        expect(htmlBefore).toBe(htmlAfter);
    });

    describe('Test "Sort on Types"', () => {
        it('Should correctly sort all evolutions for pokemon in the dex when "Sort on types" is clicked', () => {
            const emptyFarmFile = path.join(__dirname, '..', 'data', 'emptyFarm.html');
            const emptyFarmHTML = fs.readFileSync(emptyFarmFile, 'utf8', 'r');
            const innerHTML = emptyFarmHTML.replace(/<html .*?>/, '').replace(/<\/html>/, '').trim();
            global.location.href = 'https://pokefarm.com/farm#tab=1';
            document.documentElement.innerHTML = innerHTML;

            const evolvablePokemonFile = path.join(__dirname, '..', 'data', 'evolvablePokemon.json');
            const json = fs.readFileSync(evolvablePokemonFile, 'utf8', 'r');
            const evolvablePokemon = JSON.parse(json);

            // load pokedex
            const dexPath = path.join(__dirname, '../data/', 'dex.json');
            const dex = fs.readFileSync(dexPath, 'utf8', 'r');
            const parsedDex = JSON.parse(dex);
            localStorage.setItem(dexKey, dex);

            localStorage.setItem(key, JSON.stringify(initialFarmSettings));

            // setup input data
            const evolvableList = document.querySelector('#farmnews-evolutions>div.scrollable>ul');
            const jsonPath = path.join(__dirname, '..', 'data', 'farmSortOnType_SummaryUIDs.json');
            const uidsJson = JSON.parse(fs.readFileSync(jsonPath));

            // arrays used for building data
            const outputHTMLEntries = [];
            for(let i = 0; i < TYPES_LIST.length; i++) {
                outputHTMLEntries.push([]);
            }
            const UNKNOWN_SOURCE_INDEX = 18;
            const UNKNOWN_TARGET_INDEX = 19;
            outputHTMLEntries[UNKNOWN_SOURCE_INDEX] = [];
            outputHTMLEntries[UNKNOWN_TARGET_INDEX] = [];

            for (let i = 0; i < evolvablePokemon.length; i++) {
                const { dex_id: sourceID, dex_id_evolution: targetID, name_source: sourceFullName, name_target: targetFullName } = evolvablePokemon[i];
                let { types, types_source: sourceTypes, types_target: targetTypes } = evolvablePokemon[i];
                types = types.filter((t, i, self) => i == self.indexOf(t));
                sourceTypes = sourceTypes.filter((t, i, self) => i == self.indexOf(t));
                targetTypes = targetTypes.filter((t, i, self) => i == self.indexOf(t));

                /* the data will contain full form names, but in actuality, Pokemon will only include
                the base name of the source pokemon */
                const sourceName = sourceFullName.includes('[') ? sourceFullName.substring(0, sourceFullName.indexOf('[')).trim() : sourceFullName;
                const targetName = targetFullName.includes('[') ? targetFullName.substring(0, targetFullName.indexOf('[')).trim() : targetFullName;
                const sourceDexifiedName = (isPokefarmFakemon(dex, sourceID) ? sourceFullName.replace(' [', '/').replace(']', '') : sourceName)
                    .replace(/é/g, '\\u00e9')
                    .replace(/ñ/g, '\\u00f1')
                    .replace(/í/g, '\\u00ed');
                const targetDexifiedName = (isPokefarmFakemon(dex, targetID) ? targetFullName.replace(' [', '/').replace(']', '') : targetName)
                    .replace(/é/g, '\\u00e9')
                    .replace(/ñ/g, '\\u00f1')
                    .replace(/í/g, '\\u00ed');

                const summaryUid = getSummaryUID(uidsJson, sourceID, sourceName, targetID, targetName);
                const farmInputHTML = buildHTMLFarmEntry(sourceName, targetFullName, 'M', summaryUid);
                const farmExpectedOutputHTML = buildHTMLFarmEntry(sourceName, targetFullName, 'M', summaryUid);

                evolvableList.insertAdjacentHTML('beforeend', farmInputHTML);

                /* if the source pokemon is in the dex, add it to the correct expected types
                   if it is not in the dex, add it to the unknown types */
                const sourceDexIndex = parsedDex.indexOf(`"${sourceDexifiedName}"`);
                const targetDexIndex = parsedDex.indexOf(`"${targetDexifiedName}"`);
                const sourceInDex = sourceDexIndex >= 0 && parsedDex[sourceDexIndex - 1].includes(`"${sourceID}"`);
                const targetInDex = targetDexIndex >= 0 && parsedDex[targetDexIndex - 1].includes(`"${targetID}"`);
                const targetInExceptions = targetFullName in initialFarmSettings.KNOWN_EXCEPTIONS;
                if(targetInExceptions) {
                    const exceptionTypes = initialFarmSettings.KNOWN_EXCEPTIONS[targetFullName].filter((t, i, self) => i == self.indexOf(t));
                    for (let j = 0; j < exceptionTypes.length; j++) {
                        outputHTMLEntries[exceptionTypes[j]].push(farmExpectedOutputHTML);
                    }
                } else {
                    if(sourceInDex) {
                        if(targetInDex) {
                            // types contains source's and target's types
                            for (let j = 0; j < types.length; j++) {
                                outputHTMLEntries[types[j]].push(farmExpectedOutputHTML);
                            }
                        } else {
                            for (let j = 0; j < sourceTypes.length; j++) {
                                outputHTMLEntries[sourceTypes[j]].push(farmExpectedOutputHTML);
                            }
                            outputHTMLEntries[UNKNOWN_TARGET_INDEX].push(farmExpectedOutputHTML);
                        }
                    } else {
                        outputHTMLEntries[UNKNOWN_SOURCE_INDEX].push(farmExpectedOutputHTML);

                        if(targetInDex) {
                            for (let j = 0; j < targetTypes.length; j++) {
                                outputHTMLEntries[targetTypes[j]].push(farmExpectedOutputHTML);
                            }
                        } else {
                            outputHTMLEntries[UNKNOWN_TARGET_INDEX].push(farmExpectedOutputHTML);
                        }
                    }
                }
            }

            // setup expected output data

            // Create the <ul>...</ul> HTML with the expected output elements
            for (let j = 0; j < TYPES_LIST.length; j++) {
                outputHTMLEntries[j] = buildSortedOnTypeFarmEntry(TYPES_LIST[j], j, outputHTMLEntries[j]);
            }
            outputHTMLEntries[18] = buildSortedOnTypeFarmEntry('Unknown Types', 18, outputHTMLEntries[18], true);
            const expectedOutputUl = `<ul class="qolEvolveTypeList">${outputHTMLEntries.join(' ')}</ul>`;

            new pfqol.pfqol($);

            // trigger '#qolchangesletype' click handler
            $('#qolchangesletype').trigger('click');

            expect($('.qolEvolveTypeList').length).toBe(1);
            expect($('.evolvepkmnlist').length).toBe(1);
            expect($('.qolEvolveTypeList').css('display')).toBe('block');
            expect($('.evolvepkmnlist').css('display')).toBe('none');
            const actualHTML = $('#farmnews-evolutions .scrollable').children().eq(0);

            const expectedHTML = $(expectedOutputUl);
            // Write out to files for debugging
            fs.writeFileSync('./actualHTML.html', actualHTML.html());
            fs.writeFileSync('./expectedHTML.html', expectedHTML.html());
            const [status, msg] = actualHTML.equivalent(expectedHTML);
            expect(msg).toBeUndefined();
            expect(status).toBeTruthy();
        });
    });

    describe('Test "Sort on Name"', () => {
        it('Should sort on names when "Sort on name" is clicked', () => {
            const htmlpath = path.join(__dirname, '../data/', 'farm.html');
            const html = fs.readFileSync(htmlpath, 'utf8', 'r');
            const innerHTML = html.replace(/<html .*?>/, '').replace(/<\/html>/, '').trim();
            global.location.href = 'https://pokefarm.com/farm#tab=1';
            document.documentElement.innerHTML = innerHTML;

            const expectedPath = path.join(__dirname, '../data/', 'farmListSortedOnName.html');
            const expectedObjects = $($.parseHTML(fs.readFileSync(expectedPath, 'utf8', 'r').trim()));
            const expectedHTML = expectedObjects.filter('ul');
            // need to remove all the internal whitespace
            internalTrim(expectedHTML);

            // load pokedex
            const dexPath = path.join(__dirname, '../data/', 'dex.json');
            const dex = fs.readFileSync(dexPath, 'utf8', 'r');
            localStorage.setItem(dexKey, dex);

            localStorage.setItem(key, JSON.stringify(initialFarmSettings));

            new pfqol.pfqol($);

            // trigger '#qolsortevolvename' click handler
            $('#qolsortevolvename').trigger('click');

            expect($('.qolEvolveNameList').length).toBe(1);
            expect($('.evolvepkmnlist').length).toBe(1);
            expect($('.qolEvolveNameList').css('display')).toBe('block');
            expect($('.evolvepkmnlist').css('display')).toBe('none');
            const actualHTML = $('#farmnews-evolutions .scrollable').children();
            internalTrim(actualHTML);
            expect(actualHTML.equivalent(expectedHTML)).toBeTruthy();
        });
    });

    describe('Test "Sort on New"', () => {
        it('Should only show new pokemon when "New dex entry" is clicked', () => {
            const htmlpath = path.join(__dirname, '../data/', 'farm.html');
            const html = fs.readFileSync(htmlpath, 'utf8', 'r');
            const innerHTML = html.replace(/<html .*?>/, '').replace(/<\/html>/, '').trim();
            global.location.href = 'https://pokefarm.com/farm#tab=1';
            document.documentElement.innerHTML = innerHTML;

            const expectedPath = path.join(__dirname, '../data/', 'farmListSortedOnNew.html');
            const expectedObjects = $($.parseHTML(fs.readFileSync(expectedPath, 'utf8', 'r').trim()));
            const expectedHTML = expectedObjects.filter('ul');
            // need to remove all the internal whitespace
            internalTrim(expectedHTML);
            // remove comments
            removeComments(expectedHTML);

            /* load pokedex that has a few mods:
               - Charmeleon has been removed
               - Raticate [Alolan Forme] replaced Raticate
                 - Type 1 modified to be 4 (Grass)
                 - Type 2 modified to be 7 (Poison)
                 - Eggs set to 1 ("egg entry(ies) exist")
                 - Egg Dex set to 1 ("egg entry(ies) seen")
                 - Pokemon set to 2 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
               - Lycanroc's data has been modified
                 - Eggs set to 1 ("egg entry(ies) exist")
                 - Egg Dex set to 1 ("egg entry(ies) seen")
                 - Pokemon set to 3 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
               - Thievul's data has been modified
                 - Eggs set to 1 ("egg entry(ies) exist")
                 - Egg Dex set to 1 ("egg entry(ies) seen")
                 - Pokemon set to 1 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 0 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
                 Frosmoth's data has been modified
                 - Eggs set to 1 ("egg entry(ies) exist")
                 - Egg Dex set to 1 ("egg entry(ies) seen")
                 - Pokemon set to 2 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 1 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 1 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 1 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
               - Phasmaleef [Desert Forme] has been removed
               - Quibbit [Toxic Forme]'s data has been modified
                 - Eggs set to 0 ("egg entry(ies) exist")
                 - Egg Dex set to 0 ("egg entry(ies) seen")
                 - Pokemon set to 2 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
               - Quibbit [Magma Forme]'s data has been modified
                 - Eggs set to 0 ("egg entry(ies) exist")
                 - Egg Dex set to 0 ("egg entry(ies) seen")
                 - Pokemon set to 1 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 0 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck") */
            const incompleteDexPath = path.join(__dirname, '../data/', 'dex_modified.json');
            let incompleteDex = fs.readFileSync(incompleteDexPath, 'utf8', 'r');
            // use today as the date to avoid reloading the dex from the "web" (a file in this case)
            incompleteDex = JSON.parse(incompleteDex);
            incompleteDex[0] = (new Date()).toUTCString();
            incompleteDex = JSON.stringify(incompleteDex);
            localStorage.setItem(dexKey, incompleteDex);

            localStorage.setItem(key, JSON.stringify(initialFarmSettings));

            new pfqol.pfqol($);

            expect(localStorage.getItem(dexKey)).toBe(incompleteDex);

            /* test the part of the '#qolevolvenew' click handler that works with pokemon
               that have not been seen */
            $('#qolevolvenew').trigger('click');

            expect($('.qolEvolveNewList').length).toBe(1);
            expect($('.evolvepkmnlist').length).toBe(1);
            expect($('.qolEvolveNewList').css('display')).toBe('block');
            expect($('.evolvepkmnlist').css('display')).toBe('none');
            const actualHTML = $('#farmnews-evolutions .scrollable').children();
            internalTrim(actualHTML);
            /* "New" Categories and Expected Pokemon in each
               - New Pokédex entry (L741)
                 - Thievul
               - Possible Mega/Totem forme (L750)
                 - Frosmoth
               - New Shiny Pokédex entry (L761)
                 - Thievul
               - Possible Shiny Mega/Totem forme (L770)
                 - Frosmoth
               - New Albino Pokédex entry (L781)
                 - Thievul
               - Possible Albino Mega/Totem forme (L790)
                 - Frosmoth
               - New Melan Pokédex entry (L802)
                 - Thievul
               - Possible Melan Mega/Totem forme (L811)
                 - Frosmoth
               - New Pokédex entry (L827)
                 - Quibbit [Magma Forme]
               - Possible new Alolan entry (L836)
                 - Raticate [Alolan Forme]
               - Possible new forme/cloak entry (L848)
                 - Lycanroc
               - New Pokédex entry (L857)
                 - Phasmaleef [Desert Forme]
               - New Pokédex entry (L867)
                 - Charmeleon
               - Error (L877)
                 - Quibbit [Toxic Forme]
               - New Shiny Pokédex entry (L889)
                 - Quibbit [Magma Forme]
               - Possible new Shiny Alolan entry (L897)
                 - Raticate [Alolan Forme]
               - Possible new Shiny forme/cloak entry (L908)
                 - Lycanroc
               - New Shiny Pokédex entry (L917)
                 - Phasmaleef [Desert Forme]
               - New Shiny Pokédex entry (L927)
                 - Charmeleon
               - Error (L936)
                 - Quibbit [Toxic Forme]
               - New Albino Pokédex entry (L947)
                 - Quibbit [Magma Forme]
               - Possible new Albino Alolan entry (L956)
                 - Raticate [Alolan Forme]
               - Possible new Albino forme/cloak entry (L967)
                 - Lycanroc
               - New Albino Pokédex entry (L977)
                 - Phasmaleef [Desert Forme]
               - New Albino Pokédex entry (L986)
                 - Charmeleon
               - Error (L995)
                 - Quibbit [Toxic Forme]
               - New Melanistic Pokédex entry (L1006)
                 - Quibbit [Magma Forme]
               - Possible new Melanistic Alolan entry (L1015)
                 - Raticate [Alolan Forme]
               - Possible new Melanistic forme/cloak entry (L1026)
                 - Lycanroc
               - New Melanistic Pokédex entry (L1035)
                 - Phasmaleef [Desert Forme]
               - New Melanistic Pokédex entry (L1045)
                 - Charmeleon
               - Error (L1054)
                 - Quibbit [Toxic Forme] */
            /* New Categories summarized (which is how they'll appear in the HTML):
               - New Pokédex entry
                 - Thievul (L741)
                 - Quibbit [Magma Forme] (L827)
                 - Phasmaleef [Desert Forme] (L857)
                 - Charmeleon (L867)
               - Possible Mega/Totem forme (L750)
                 - Frosmoth
               - New Shiny Pokédex entry
                 - Thievul (L761)
                 - Quibbit [Magma Forme] (L889)
                 - Phasmaleef [Desert Forme] (L917)
                 - Charmeleon (L927)
               - Possible Shiny Mega/Totem forme (L770)
                 - Frosmoth
               - New Albino Pokédex entry
                 - Thievul (L781)
                 - Quibbit [Magma Forme] (L947)
                 - Phasmaleef [Desert Forme] (L977)
                 - Charmeleon (L986)
               - Possible Albino Mega/Totem forme (L790)
                 - Frosmoth
               - New Melan Pokédex entry
                 - Thievul (L802)
                 - Quibbit [Magma Forme] (L1006)
                 - Phasmaleef [Desert Forme] (L1035)
                 - Charmeleon (L1045)
               - Possible Melan Mega/Totem forme (L811)
                 - Frosmoth
               - Possible new Alolan entry (L836)
                 - Raticate [Alolan Forme]
               - Possible new forme/cloak entry (L848)
                 - Lycanroc
               - Error
                 - Quibbit [Toxic Forme] (L877)
                 - Quibbit [Toxic Forme] (L936)
                 - Quibbit [Toxic Forme] (L995)
                 - Quibbit [Toxic Forme] (L1054)
               - Possible new Shiny Alolan entry (L897)
                 - Raticate [Alolan Forme]
               - Possible new Shiny forme/cloak entry (L908)
                 - Lycanroc
               - Possible new Albino Alolan entry (L956)
                 - Raticate [Alolan Forme]
               - Possible new Albino forme/cloak entry (L967)
                 - Lycanroc
               - Possible new Melan Alolan entry (L1015)
                 - Raticate [Alolan Forme]
               - Possible new Melan forme/cloak entry (L1026)
                 - Lycanroc */
            expect(actualHTML.equivalent(expectedHTML)).toBeTruthy();
        });

        it('Test when normal pokemon with multiple words in its name is not in the dex', () => {
            const htmlpath = path.join(__dirname, '../data/', 'farm.html');
            const html = fs.readFileSync(htmlpath, 'utf8', 'r');
            const innerHTML = html.replace(/<html .*?>/, '').replace(/<\/html>/, '').trim();
            global.location.href = 'https://pokefarm.com/farm#tab=1';
            document.documentElement.innerHTML = innerHTML;

            const expectedPath = path.join(__dirname, '../data/', 'farmListSortedOnNew2.html');
            const expectedObjects = $($.parseHTML(fs.readFileSync(expectedPath, 'utf8', 'r').trim()));
            const expectedHTML = expectedObjects.filter('ul');
            // need to remove all the internal whitespace
            internalTrim(expectedHTML);
            // remove comments
            removeComments(expectedHTML);

            /* load pokedex that has a few mods:
               - Charmeleon has been removed
               - Raticate [Alolan Forme] replaced Raticate
                 - Type 1 modified to be 4 (Grass)
                 - Type 2 modified to be 7 (Poison)
                 - Eggs set to 1 ("egg entry(ies) exist")
                 - Egg Dex set to 1 ("egg entry(ies) seen")
                 - Pokemon set to 2 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
               - Lycanroc's data has been modified
                 - Eggs set to 1 ("egg entry(ies) exist")
                 - Egg Dex set to 1 ("egg entry(ies) seen")
                 - Pokemon set to 3 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
                 Frosmoth's data has been modified
                 - Eggs set to 1 ("egg entry(ies) exist")
                 - Egg Dex set to 1 ("egg entry(ies) seen")
                 - Pokemon set to 2 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 1 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 1 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 1 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
               - Phasmaleef [Desert Forme] has been removed
               - Quibbit [Toxic Forme]'s data has been modified
                 - Eggs set to 0 ("egg entry(ies) exist")
                 - Egg Dex set to 0 ("egg entry(ies) seen")
                 - Pokemon set to 2 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
               - Quibbit [Magma Forme]'s data has been modified
                 - Eggs set to 0 ("egg entry(ies) exist")
                 - Egg Dex set to 0 ("egg entry(ies) seen")
                 - Pokemon set to 1 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 0 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck") */
            const incompleteDexPath = path.join(__dirname, '../data/', 'dex_modified2.json');
            let incompleteDex = fs.readFileSync(incompleteDexPath, 'utf8', 'r');
            // use today as the date to avoid reloading the dex from the "web" (a file in this case)
            incompleteDex = JSON.parse(incompleteDex);
            incompleteDex[0] = (new Date()).toUTCString();
            incompleteDex = JSON.stringify(incompleteDex);
            localStorage.setItem(dexKey, incompleteDex);

            localStorage.setItem(key, JSON.stringify(initialFarmSettings));

            new pfqol.pfqol($);

            expect(localStorage.getItem(dexKey)).toBe(incompleteDex);

            /* test the part of the '#qolevolvenew' click handler that works with pokemon
               that have not been seen */
            $('#qolevolvenew').trigger('click');

            expect($('.qolEvolveNewList').length).toBe(1);
            expect($('.evolvepkmnlist').length).toBe(1);
            expect($('.qolEvolveNewList').css('display')).toBe('block');
            expect($('.evolvepkmnlist').css('display')).toBe('none');
            const actualHTML = $('#farmnews-evolutions .scrollable').children();
            internalTrim(actualHTML);
            /* "New" Categories and Expected Pokemon in each
               - Possible Mega/Totem forme (L750)
                 - Frosmoth
               - Possible Shiny Mega/Totem forme (L770)
                 - Frosmoth
               - Possible Albino Mega/Totem forme (L790)
                 - Frosmoth
               - Possible Melan Mega/Totem forme (L811)
                 - Frosmoth
               - New Pokédex entry (L827)
                 - Quibbit [Magma Forme]
               - Possible new Alolan entry (L836)
                 - Raticate [Alolan Forme]
               - Possible new forme/cloak entry (L848)
                 - Lycanroc
               - New Pokédex entry (L857)
                 - Phasmaleef [Desert Forme]
               - New Pokédex entry (L867)
                 - Charmeleon
               - Error (L877)
                 - Quibbit [Toxic Forme]
               - New Shiny Pokédex entry (L889)
                 - Quibbit [Magma Forme]
               - Possible new Shiny Alolan entry (L897)
                 - Raticate [Alolan Forme]
               - Possible new Shiny forme/cloak entry (L908)
                 - Lycanroc
               - New Shiny Pokédex entry (L917)
                 - Phasmaleef [Desert Forme]
               - New Shiny Pokédex entry (L927)
                 - Charmeleon
               - Error (L936)
                 - Quibbit [Toxic Forme]
               - New Albino Pokédex entry (L947)
                 - Quibbit [Magma Forme]
               - Possible new Albino Alolan entry (L956)
                 - Raticate [Alolan Forme]
               - Possible new Albino forme/cloak entry (L967)
                 - Lycanroc
               - New Albino Pokédex entry (L977)
                 - Phasmaleef [Desert Forme]
               - New Albino Pokédex entry (L986)
                 - Charmeleon
               - Error (L995)
                 - Quibbit [Toxic Forme]
               - New Melanistic Pokédex entry (L1006)
                 - Quibbit [Magma Forme]
               - Possible new Melanistic Alolan entry (L1015)
                 - Raticate [Alolan Forme]
               - Possible new Melanistic forme/cloak entry (L1026)
                 - Lycanroc
               - New Melanistic Pokédex entry (L1035)
                 - Phasmaleef [Desert Forme]
               - New Melanistic Pokédex entry (L1045)
                 - Charmeleon
               - Error (L1054)
                 - Quibbit [Toxic Forme] */
            /* New Categories summarized (which is how they'll appear in the HTML):
               - New Pokédex entry
                 - Quibbit [Magma Forme] (L827)
                 - Phasmaleef [Desert Forme] (L857)
                 - Charmeleon (L867)
               - Possible Mega/Totem forme (L750)
                 - Frosmoth
               - New Shiny Pokédex entry
                 - Quibbit [Magma Forme] (L889)
                 - Phasmaleef [Desert Forme] (L917)
                 - Charmeleon (L927)
               - Possible Shiny Mega/Totem forme (L770)
                 - Frosmoth
               - New Albino Pokédex entry
                 - Quibbit [Magma Forme] (L947)
                 - Phasmaleef [Desert Forme] (L977)
                 - Charmeleon (L986)
               - Possible Albino Mega/Totem forme (L790)
                 - Frosmoth
               - New Melan Pokédex entry
                 - Quibbit [Magma Forme] (L1006)
                 - Phasmaleef [Desert Forme] (L1035)
                 - Charmeleon (L1045)
               - Possible Melan Mega/Totem forme (L811)
                 - Frosmoth
               - Possible new Alolan entry (L836)
                 - Raticate [Alolan Forme]
               - Possible new forme/cloak entry (L848)
                 - Lycanroc
               - Error
                 - Quibbit [Toxic Forme] (L877)
                 - Quibbit [Toxic Forme] (L936)
                 - Quibbit [Toxic Forme] (L995)
                 - Quibbit [Toxic Forme] (L1054)
               - Possible new Shiny Alolan entry (L897)
                 - Raticate [Alolan Forme]
               - Possible new Shiny forme/cloak entry (L908)
                 - Lycanroc
               - Possible new Albino Alolan entry (L956)
                 - Raticate [Alolan Forme]
               - Possible new Albino forme/cloak entry (L967)
                 - Lycanroc
               - Possible new Melan Alolan entry (L1015)
                 - Raticate [Alolan Forme]
               - Possible new Melan forme/cloak entry (L1026)
                 - Lycanroc */
            expect(actualHTML.equivalent(expectedHTML)).toBeTruthy();
        });

        it('Test when normal pokemon with multiple words and [ in its name is not in the dex', () => {
            const htmlpath = path.join(__dirname, '../data/', 'farm.html');
            const html = fs.readFileSync(htmlpath, 'utf8', 'r');
            const innerHTML = html.replace(/<html .*?>/, '').replace(/<\/html>/, '').trim();
            global.location.href = 'https://pokefarm.com/farm#tab=1';
            document.documentElement.innerHTML = innerHTML;

            const expectedPath = path.join(__dirname, '../data/', 'farmListSortedOnNew3.html');
            const expectedObjects = $($.parseHTML(fs.readFileSync(expectedPath, 'utf8', 'r').trim()));
            const expectedHTML = expectedObjects.filter('ul');
            // need to remove all the internal whitespace
            internalTrim(expectedHTML);
            // remove comments
            removeComments(expectedHTML);

            /* load pokedex that has a few mods:
               - Charmeleon has been removed
               - Raticate [Alolan Forme] replaced Raticate
                 - Type 1 modified to be 4 (Grass)
                 - Type 2 modified to be 7 (Poison)
                 - Eggs set to 1 ("egg entry(ies) exist")
                 - Egg Dex set to 1 ("egg entry(ies) seen")
                 - Pokemon set to 2 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
               - Lycanroc's data has been modified
                 - Eggs set to 1 ("egg entry(ies) exist")
                 - Egg Dex set to 1 ("egg entry(ies) seen")
                 - Pokemon set to 3 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
                 Frosmoth's data has been modified
                 - Eggs set to 1 ("egg entry(ies) exist")
                 - Egg Dex set to 1 ("egg entry(ies) seen")
                 - Pokemon set to 2 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 1 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 1 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 1 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
               - Phasmaleef [Desert Forme] has been removed
               - Quibbit [Toxic Forme]'s data has been modified
                 - Eggs set to 0 ("egg entry(ies) exist")
                 - Egg Dex set to 0 ("egg entry(ies) seen")
                 - Pokemon set to 2 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
               - Quibbit [Magma Forme]'s data has been modified
                 - Eggs set to 0 ("egg entry(ies) exist")
                 - Egg Dex set to 0 ("egg entry(ies) seen")
                 - Pokemon set to 1 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 0 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck") */
            const incompleteDexPath = path.join(__dirname, '../data/', 'dex_modified3.json');
            let incompleteDex = fs.readFileSync(incompleteDexPath, 'utf8', 'r');
            // use today as the date to avoid reloading the dex from the "web" (a file in this case)
            incompleteDex = JSON.parse(incompleteDex);
            incompleteDex[0] = (new Date()).toUTCString();
            incompleteDex = JSON.stringify(incompleteDex);
            localStorage.setItem(dexKey, incompleteDex);

            localStorage.setItem(key, JSON.stringify(initialFarmSettings));

            new pfqol.pfqol($);

            expect(localStorage.getItem(dexKey)).toBe(incompleteDex);

            /* test the part of the '#qolevolvenew' click handler that works with pokemon
               that have not been seen */
            $('#qolevolvenew').trigger('click');

            expect($('.qolEvolveNewList').length).toBe(1);
            expect($('.evolvepkmnlist').length).toBe(1);
            expect($('.qolEvolveNewList').css('display')).toBe('block');
            expect($('.evolvepkmnlist').css('display')).toBe('none');
            const actualHTML = $('#farmnews-evolutions .scrollable').children();
            internalTrim(actualHTML);
            /* "New" Categories and Expected Pokemon in each
               - Possible Mega/Totem forme (L750)
                 - Frosmoth
               - Possible Shiny Mega/Totem forme (L770)
                 - Frosmoth
               - Possible Albino Mega/Totem forme (L790)
                 - Frosmoth
               - Possible Melan Mega/Totem forme (L811)
                 - Frosmoth
               - New Pokédex entry (L827)
                 - Quibbit [Magma Forme]
               - Possible new Alolan entry (L836)
                 - Raticate [Alolan Forme]
               - Possible new forme/cloak entry (L848)
                 - Lycanroc
               - New Pokédex entry (L857)
                 - Phasmaleef [Desert Forme]
               - New Pokédex entry (L867)
                 - Charmeleon
               - Error (L877)
                 - Quibbit [Toxic Forme]
               - New Shiny Pokédex entry (L889)
                 - Quibbit [Magma Forme]
               - Possible new Shiny Alolan entry (L897)
                 - Raticate [Alolan Forme]
               - Possible new Shiny forme/cloak entry (L908)
                 - Lycanroc
               - New Shiny Pokédex entry (L917)
                 - Phasmaleef [Desert Forme]
               - New Shiny Pokédex entry (L927)
                 - Charmeleon
               - Error (L936)
                 - Quibbit [Toxic Forme]
               - New Albino Pokédex entry (L947)
                 - Quibbit [Magma Forme]
               - Possible new Albino Alolan entry (L956)
                 - Raticate [Alolan Forme]
               - Possible new Albino forme/cloak entry (L967)
                 - Lycanroc
               - New Albino Pokédex entry (L977)
                 - Phasmaleef [Desert Forme]
               - New Albino Pokédex entry (L986)
                 - Charmeleon
               - Error (L995)
                 - Quibbit [Toxic Forme]
               - New Melanistic Pokédex entry (L1006)
                 - Quibbit [Magma Forme]
               - Possible new Melanistic Alolan entry (L1015)
                 - Raticate [Alolan Forme]
               - Possible new Melanistic forme/cloak entry (L1026)
                 - Lycanroc
               - New Melanistic Pokédex entry (L1035)
                 - Phasmaleef [Desert Forme]
               - New Melanistic Pokédex entry (L1045)
                 - Charmeleon
               - Error (L1054)
                 - Quibbit [Toxic Forme] */
            /* New Categories summarized (which is how they'll appear in the HTML):
               - New Pokédex entry
                 - Quibbit [Magma Forme] (L827)
                 - Phasmaleef [Desert Forme] (L857)
                 - Charmeleon (L867)
               - Possible Mega/Totem forme (L750)
                 - Frosmoth
               - New Shiny Pokédex entry
                 - Quibbit [Magma Forme] (L889)
                 - Phasmaleef [Desert Forme] (L917)
                 - Charmeleon (L927)
               - Possible Shiny Mega/Totem forme (L770)
                 - Frosmoth
               - New Albino Pokédex entry
                 - Quibbit [Magma Forme] (L947)
                 - Phasmaleef [Desert Forme] (L977)
                 - Charmeleon (L986)
               - Possible Albino Mega/Totem forme (L790)
                 - Frosmoth
               - New Melan Pokédex entry
                 - Quibbit [Magma Forme] (L1006)
                 - Phasmaleef [Desert Forme] (L1035)
                 - Charmeleon (L1045)
               - Possible Melan Mega/Totem forme (L811)
                 - Frosmoth
               - Possible new Alolan entry (L836)
                 - Raticate [Alolan Forme]
               - Possible new forme/cloak entry (L848)
                 - Lycanroc
               - Error
                 - Quibbit [Toxic Forme] (L877)
                 - Quibbit [Toxic Forme] (L936)
                 - Quibbit [Toxic Forme] (L995)
                 - Quibbit [Toxic Forme] (L1054)
               - Possible new Shiny Alolan entry (L897)
                 - Raticate [Alolan Forme]
               - Possible new Shiny forme/cloak entry (L908)
                 - Lycanroc
               - Possible new Albino Alolan entry (L956)
                 - Raticate [Alolan Forme]
               - Possible new Albino forme/cloak entry (L967)
                 - Lycanroc
               - Possible new Melan Alolan entry (L1015)
                 - Raticate [Alolan Forme]
               - Possible new Melan forme/cloak entry (L1026)
                 - Lycanroc */
            expect(actualHTML.equivalent(expectedHTML)).toBeTruthy();
        });

        it('Test when normal pokemon with a regular name is not in the dex', () => {
            const htmlpath = path.join(__dirname, '../data/', 'farm.html');
            const html = fs.readFileSync(htmlpath, 'utf8', 'r');
            const innerHTML = html.replace(/<html .*?>/, '').replace(/<\/html>/, '').trim();
            global.location.href = 'https://pokefarm.com/farm#tab=1';
            document.documentElement.innerHTML = innerHTML;

            const expectedPath = path.join(__dirname, '../data/', 'farmListSortedOnNew4.html');
            const expectedObjects = $($.parseHTML(fs.readFileSync(expectedPath, 'utf8', 'r').trim()));
            const expectedHTML = expectedObjects.filter('ul');
            // need to remove all the internal whitespace
            internalTrim(expectedHTML);
            // remove comments
            removeComments(expectedHTML);

            /* load pokedex that has a few mods:
               - Charmeleon has been removed
               - Raticate [Alolan Forme] replaced Raticate
                 - Type 1 modified to be 4 (Grass)
                 - Type 2 modified to be 7 (Poison)
                 - Eggs set to 1 ("egg entry(ies) exist")
                 - Egg Dex set to 1 ("egg entry(ies) seen")
                 - Pokemon set to 2 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
               - Lycanroc's data has been modified
                 - Eggs set to 1 ("egg entry(ies) exist")
                 - Egg Dex set to 1 ("egg entry(ies) seen")
                 - Pokemon set to 3 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
                 Frosmoth's data has been modified
                 - Eggs set to 1 ("egg entry(ies) exist")
                 - Egg Dex set to 1 ("egg entry(ies) seen")
                 - Pokemon set to 2 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 1 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 1 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 1 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
               - Quibbit [Toxic Forme]'s data has been modified
                 - Eggs set to 0 ("egg entry(ies) exist")
                 - Egg Dex set to 0 ("egg entry(ies) seen")
                 - Pokemon set to 2 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck") */
            const incompleteDexPath = path.join(__dirname, '../data/', 'dex_modified4.json');
            let incompleteDex = fs.readFileSync(incompleteDexPath, 'utf8', 'r');
            // use today as the date to avoid reloading the dex from the "web" (a file in this case)
            incompleteDex = JSON.parse(incompleteDex);
            incompleteDex[0] = (new Date()).toUTCString();
            incompleteDex = JSON.stringify(incompleteDex);
            localStorage.setItem(dexKey, incompleteDex);

            localStorage.setItem(key, JSON.stringify(initialFarmSettings));

            new pfqol.pfqol($);

            expect(localStorage.getItem(dexKey)).toBe(incompleteDex);

            /* test the part of the '#qolevolvenew' click handler that works with pokemon
               that have not been seen */
            $('#qolevolvenew').trigger('click');

            expect($('.qolEvolveNewList').length).toBe(1);
            expect($('.evolvepkmnlist').length).toBe(1);
            expect($('.qolEvolveNewList').css('display')).toBe('block');
            expect($('.evolvepkmnlist').css('display')).toBe('none');
            const actualHTML = $('#farmnews-evolutions .scrollable').children();
            internalTrim(actualHTML);
            /* "New" Categories and Expected Pokemon in each
               - Possible Mega/Totem forme (L750)
                 - Frosmoth
               - Possible Shiny Mega/Totem forme (L770)
                 - Frosmoth
               - Possible Albino Mega/Totem forme (L790)
                 - Frosmoth
               - Possible Melan Mega/Totem forme (L811)
                 - Frosmoth
               - New Pokédex entry (L827)
                 - Quibbit [Magma Forme]
               - Possible new Alolan entry (L836)
                 - Raticate [Alolan Forme]
               - Possible new forme/cloak entry (L848)
                 - Lycanroc
               - New Pokédex entry (L867)
                 - Charmeleon
               - Error (L877)
                 - Quibbit [Toxic Forme]
               - New Shiny Pokédex entry (L889)
                 - Quibbit [Magma Forme]
               - Possible new Shiny Alolan entry (L897)
                 - Raticate [Alolan Forme]
               - Possible new Shiny forme/cloak entry (L908)
                 - Lycanroc
               - New Shiny Pokédex entry (L927)
                 - Charmeleon
               - Error (L936)
                 - Quibbit [Toxic Forme]
               - New Albino Pokédex entry (L947)
                 - Quibbit [Magma Forme]
               - Possible new Albino Alolan entry (L956)
                 - Raticate [Alolan Forme]
               - Possible new Albino forme/cloak entry (L967)
                 - Lycanroc
               - New Albino Pokédex entry (L986)
                 - Charmeleon
               - Error (L995)
                 - Quibbit [Toxic Forme]
               - New Melanistic Pokédex entry (L1006)
                 - Quibbit [Magma Forme]
               - Possible new Melanistic Alolan entry (L1015)
                 - Raticate [Alolan Forme]
               - Possible new Melanistic forme/cloak entry (L1026)
                 - Lycanroc
               - New Melanistic Pokédex entry (L1045)
                 - Charmeleon
               - Error (L1054)
                 - Quibbit [Toxic Forme] */
            /* New Categories summarized (which is how they'll appear in the HTML):
               - New Pokédex entry
                 - Charmeleon (L867)
               - Possible Mega/Totem forme (L750)
                 - Frosmoth
               - New Shiny Pokédex entry
                 - Charmeleon (L927)
               - Possible Shiny Mega/Totem forme (L770)
                 - Frosmoth
               - New Albino Pokédex entry
                 - Charmeleon (L986)
               - Possible Albino Mega/Totem forme (L790)
                 - Frosmoth
               - New Melan Pokédex entry
                 - Charmeleon (L1045)
               - Possible Melan Mega/Totem forme (L811)
                 - Frosmoth
               - Possible new Alolan entry (L836)
                 - Raticate [Alolan Forme]
               - Possible new forme/cloak entry (L848)
                 - Lycanroc
               - Error
                 - Quibbit [Toxic Forme] (L877)
                 - Quibbit [Toxic Forme] (L936)
                 - Quibbit [Toxic Forme] (L995)
                 - Quibbit [Toxic Forme] (L1054)
               - Possible new Shiny Alolan entry (L897)
                 - Raticate [Alolan Forme]
               - Possible new Shiny forme/cloak entry (L908)
                 - Lycanroc
               - Possible new Albino Alolan entry (L956)
                 - Raticate [Alolan Forme]
               - Possible new Albino forme/cloak entry (L967)
                 - Lycanroc
               - Possible new Melan Alolan entry (L1015)
                 - Raticate [Alolan Forme]
               - Possible new Melan forme/cloak entry (L1026)
                 - Lycanroc */
            expect(actualHTML.equivalent(expectedHTML)).toBeTruthy();
        });

        it('Test when melanistic pokemon with a regular name is not in the dex', () => {
            const htmlpath = path.join(__dirname, '../data/', 'farm.html');
            const html = fs.readFileSync(htmlpath, 'utf8', 'r');
            const innerHTML = html.replace(/<html .*?>/, '').replace(/<\/html>/, '').trim();
            global.location.href = 'https://pokefarm.com/farm#tab=1';
            document.documentElement.innerHTML = innerHTML;

            const expectedPath = path.join(__dirname, '../data/', 'farmListSortedOnNew5.html');
            const expectedObjects = $($.parseHTML(fs.readFileSync(expectedPath, 'utf8', 'r').trim()));
            const expectedHTML = expectedObjects.filter('ul');
            // need to remove all the internal whitespace
            internalTrim(expectedHTML);
            // remove comments
            removeComments(expectedHTML);

            /* load pokedex that has a few mods:
               - Charmeleon has been removed
               - Lycanroc's data has been modified
                 - Eggs set to 1 ("egg entry(ies) exist")
                 - Egg Dex set to 1 ("egg entry(ies) seen")
                 - Pokemon set to 3 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
                 Frosmoth's data has been modified
                 - Eggs set to 1 ("egg entry(ies) exist")
                 - Egg Dex set to 1 ("egg entry(ies) seen")
                 - Pokemon set to 2 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 1 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 1 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 1 ("melanistic entry(ies) seen") ("evolveNewMelaCheck")
               - Quibbit [Toxic Forme]'s data has been modified
                 - Eggs set to 0 ("egg entry(ies) exist")
                 - Egg Dex set to 0 ("egg entry(ies) seen")
                 - Pokemon set to 2 ("pokemon entry(ies) exist")     ("evolveNewTotal")
                 - Poke Dex set to 1 ("pokemon entry(ies) seen")     ("evolveNewCheck")
                 - Shiny Dex set to 0 ("shiny entry(ies) seen")      ("evolveNewShinyCheck")
                 - Albino Dex set to 0 ("albino entry(ies) seen")    ("evolveNewAlbinoCheck")
                 - Melan Dex set to 0 ("melanistic entry(ies) seen") ("evolveNewMelaCheck") */
            const incompleteDexPath = path.join(__dirname, '../data/', 'dex_modified5.json');
            let incompleteDex = fs.readFileSync(incompleteDexPath, 'utf8', 'r');
            // use today as the date to avoid reloading the dex from the "web" (a file in this case)
            incompleteDex = JSON.parse(incompleteDex);
            incompleteDex[0] = (new Date()).toUTCString();
            incompleteDex = JSON.stringify(incompleteDex);
            localStorage.setItem(dexKey, incompleteDex);

            localStorage.setItem(key, JSON.stringify(initialFarmSettings));

            new pfqol.pfqol($);

            expect(localStorage.getItem(dexKey)).toBe(incompleteDex);

            /* test the part of the '#qolevolvenew' click handler that works with pokemon
               that have not been seen */
            $('#qolevolvenew').trigger('click');

            expect($('.qolEvolveNewList').length).toBe(1);
            expect($('.evolvepkmnlist').length).toBe(1);
            expect($('.qolEvolveNewList').css('display')).toBe('block');
            expect($('.evolvepkmnlist').css('display')).toBe('none');
            const actualHTML = $('#farmnews-evolutions .scrollable').children();
            internalTrim(actualHTML);
            /* "New" Categories and Expected Pokemon in each
               - Possible Mega/Totem forme (L750)
                 - Frosmoth
               - Possible Shiny Mega/Totem forme (L770)
                 - Frosmoth
               - Possible Albino Mega/Totem forme (L790)
                 - Frosmoth
               - Possible Melan Mega/Totem forme (L811)
                 - Frosmoth
               - New Pokédex entry (L827)
                 - Quibbit [Magma Forme]
               - Possible new Alolan entry (L836)
                 - Raticate [Alolan Forme]
               - Possible new forme/cloak entry (L848)
                 - Lycanroc
               - New Pokédex entry (L867)
                 - Charmeleon
               - Error (L877)
                 - Quibbit [Toxic Forme]
               - New Shiny Pokédex entry (L889)
                 - Quibbit [Magma Forme]
               - Possible new Shiny Alolan entry (L897)
                 - Raticate [Alolan Forme]
               - Possible new Shiny forme/cloak entry (L908)
                 - Lycanroc
               - New Shiny Pokédex entry (L927)
                 - Charmeleon
               - Error (L936)
                 - Quibbit [Toxic Forme]
               - New Albino Pokédex entry (L947)
                 - Quibbit [Magma Forme]
               - Possible new Albino Alolan entry (L956)
                 - Raticate [Alolan Forme]
               - Possible new Albino forme/cloak entry (L967)
                 - Lycanroc
               - New Albino Pokédex entry (L986)
                 - Charmeleon
               - Error (L995)
                 - Quibbit [Toxic Forme]
               - New Melanistic Pokédex entry (L1006)
                 - Quibbit [Magma Forme]
               - Possible new Melanistic Alolan entry (L1015)
                 - Raticate [Alolan Forme]
               - Possible new Melanistic forme/cloak entry (L1026)
                 - Lycanroc
               - New Melanistic Pokédex entry (L1045)
                 - Charmeleon
               - Error (L1054)
                 - Quibbit [Toxic Forme] */
            /* New Categories summarized (which is how they'll appear in the HTML):
               - New Pokédex entry
                 - Charmeleon (L867)
               - Possible Mega/Totem forme (L750)
                 - Frosmoth
               - New Shiny Pokédex entry
                 - Charmeleon (L927)
               - Possible Shiny Mega/Totem forme (L770)
                 - Frosmoth
               - New Albino Pokédex entry
                 - Charmeleon (L986)
               - Possible Albino Mega/Totem forme (L790)
                 - Frosmoth
               - New Melan Pokédex entry
                 - Charmeleon (L1045)
               - Possible Melan Mega/Totem forme (L811)
                 - Frosmoth
               - Possible new Alolan entry (L836)
                 - Raticate [Alolan Forme]
               - Possible new forme/cloak entry (L848)
                 - Lycanroc
               - Error
                 - Quibbit [Toxic Forme] (L877)
                 - Quibbit [Toxic Forme] (L936)
                 - Quibbit [Toxic Forme] (L995)
                 - Quibbit [Toxic Forme] (L1054)
               - Possible new Shiny Alolan entry (L897)
                 - Raticate [Alolan Forme]
               - Possible new Shiny forme/cloak entry (L908)
                 - Lycanroc
               - Possible new Albino Alolan entry (L956)
                 - Raticate [Alolan Forme]
               - Possible new Albino forme/cloak entry (L967)
                 - Lycanroc
               - Possible new Melan Alolan entry (L1015)
                 - Raticate [Alolan Forme]
               - Possible new Melan forme/cloak entry (L1026)
                 - Lycanroc */
            expect(actualHTML.equivalent(expectedHTML)).toBeTruthy();
        });

        it('Test the error case where a normal pokemon with a name that doens\'t meet any criteria is found in the dex', () => {
            const htmlpath = path.join(__dirname, '../data/', 'farmWithFakeNormalPokemon.html');
            const html = fs.readFileSync(htmlpath, 'utf8', 'r');
            const innerHTML = html.replace(/<html .*?>/, '').replace(/<\/html>/, '').trim();
            global.location.href = 'https://pokefarm.com/farm#tab=1';
            document.documentElement.innerHTML = innerHTML;

            const expectedPath = path.join(__dirname, '../data/', 'farmListSortedOnNewErrorNormal.html');
            const expectedObjects = $($.parseHTML(fs.readFileSync(expectedPath, 'utf8', 'r').trim()));
            const expectedHTML = expectedObjects.filter('ul');
            // need to remove all the internal whitespace
            internalTrim(expectedHTML);
            // remove comments
            removeComments(expectedHTML);

            // load pokedex that has a fake pokemon in it named "ABC XYZ"
            const incompleteDexPath = path.join(__dirname, '../data/', 'dex_modified6.json');
            let incompleteDex = fs.readFileSync(incompleteDexPath, 'utf8', 'r');
            // use today as the date to avoid reloading the dex from the "web" (a file in this case)
            incompleteDex = JSON.parse(incompleteDex);
            incompleteDex[0] = (new Date()).toUTCString();
            incompleteDex = JSON.stringify(incompleteDex);
            localStorage.setItem(dexKey, incompleteDex);

            localStorage.setItem(key, JSON.stringify(initialFarmSettings));

            new pfqol.pfqol($);

            expect(localStorage.getItem(dexKey)).toBe(incompleteDex);

            /* test the part of the '#qolevolvenew' click handler that works with pokemon
               that have not been seen */
            $('#qolevolvenew').trigger('click');

            expect($('.qolEvolveNewList').length).toBe(1);
            expect($('.evolvepkmnlist').length).toBe(1);
            expect($('.qolEvolveNewList').css('display')).toBe('block');
            expect($('.evolvepkmnlist').css('display')).toBe('none');
            const actualHTML = $('#farmnews-evolutions .scrollable').children();
            internalTrim(actualHTML);
            /* "New" Categories and Expected Pokemon in each
               - Error (L877)
                 - ABC XYZ
               - Error (L936)
                 - ABC XYZ
               - Error (L995)
                 - ABC XYZ
               - Error (L1054)
                 - ABC XYZ */
            /* New Categories summarized (which is how they'll appear in the HTML):
               - Error
                 - ABC XYZ */
            expect(actualHTML.equivalent(expectedHTML)).toBeTruthy();
        });

        it('Test the error case where a shiny pokemon with a name that doens\'t meet any criteria is found in the dex', () => {
            const htmlpath = path.join(__dirname, '../data/', 'farmWithFakeShinyPokemon.html');
            const html = fs.readFileSync(htmlpath, 'utf8', 'r');
            const innerHTML = html.replace(/<html .*?>/, '').replace(/<\/html>/, '').trim();
            global.location.href = 'https://pokefarm.com/farm#tab=1';
            document.documentElement.innerHTML = innerHTML;

            const expectedPath = path.join(__dirname, '../data/', 'farmListSortedOnNewErrorShiny.html');
            const expectedObjects = $($.parseHTML(fs.readFileSync(expectedPath, 'utf8', 'r').trim()));
            const expectedHTML = expectedObjects.filter('ul');
            // need to remove all the internal whitespace
            internalTrim(expectedHTML);
            // remove comments
            removeComments(expectedHTML);

            // load pokedex that has a fake pokemon in it named "ABC XYZ"
            const incompleteDexPath = path.join(__dirname, '../data/', 'dex_modified6.json');
            let incompleteDex = fs.readFileSync(incompleteDexPath, 'utf8', 'r');
            // use today as the date to avoid reloading the dex from the "web" (a file in this case)
            incompleteDex = JSON.parse(incompleteDex);
            incompleteDex[0] = (new Date()).toUTCString();
            incompleteDex = JSON.stringify(incompleteDex);
            localStorage.setItem(dexKey, incompleteDex);

            localStorage.setItem(key, JSON.stringify(initialFarmSettings));

            new pfqol.pfqol($);

            expect(localStorage.getItem(dexKey)).toBe(incompleteDex);

            /* test the part of the '#qolevolvenew' click handler that works with pokemon
               that have not been seen */
            $('#qolevolvenew').trigger('click');

            expect($('.qolEvolveNewList').length).toBe(1);
            expect($('.evolvepkmnlist').length).toBe(1);
            expect($('.qolEvolveNewList').css('display')).toBe('block');
            expect($('.evolvepkmnlist').css('display')).toBe('none');
            const actualHTML = $('#farmnews-evolutions .scrollable').children();
            internalTrim(actualHTML);
            /* "New" Categories and Expected Pokemon in each
               - Error (L877)
                 - ABC XYZ
               - Error (L936)
                 - ABC XYZ
               - Error (L995)
                 - ABC XYZ
               - Error (L1054)
                 - ABC XYZ */
            /* New Categories summarized (which is how they'll appear in the HTML):
               - Error
                 - ABC XYZ */
            expect(actualHTML.equivalent(expectedHTML)).toBeTruthy();
        });

        it('Test the error case where an albino pokemon with a name that doens\'t meet any criteria is found in the dex', () => {
            const htmlpath = path.join(__dirname, '../data/', 'farmWithFakeAlbinoPokemon.html');
            const html = fs.readFileSync(htmlpath, 'utf8', 'r');
            const innerHTML = html.replace(/<html .*?>/, '').replace(/<\/html>/, '').trim();
            global.location.href = 'https://pokefarm.com/farm#tab=1';
            document.documentElement.innerHTML = innerHTML;

            const expectedPath = path.join(__dirname, '../data/', 'farmListSortedOnNewErrorAlbino.html');
            const expectedObjects = $($.parseHTML(fs.readFileSync(expectedPath, 'utf8', 'r').trim()));
            const expectedHTML = expectedObjects.filter('ul');
            // need to remove all the internal whitespace
            internalTrim(expectedHTML);
            // remove comments
            removeComments(expectedHTML);

            // load pokedex that has a fake pokemon in it named "ABC XYZ"
            const incompleteDexPath = path.join(__dirname, '../data/', 'dex_modified6.json');
            let incompleteDex = fs.readFileSync(incompleteDexPath, 'utf8', 'r');
            // use today as the date to avoid reloading the dex from the "web" (a file in this case)
            incompleteDex = JSON.parse(incompleteDex);
            incompleteDex[0] = (new Date()).toUTCString();
            incompleteDex = JSON.stringify(incompleteDex);
            localStorage.setItem(dexKey, incompleteDex);

            localStorage.setItem(key, JSON.stringify(initialFarmSettings));

            new pfqol.pfqol($);

            expect(localStorage.getItem(dexKey)).toBe(incompleteDex);

            /* test the part of the '#qolevolvenew' click handler that works with pokemon
               that have not been seen */
            $('#qolevolvenew').trigger('click');

            expect($('.qolEvolveNewList').length).toBe(1);
            expect($('.evolvepkmnlist').length).toBe(1);
            expect($('.qolEvolveNewList').css('display')).toBe('block');
            expect($('.evolvepkmnlist').css('display')).toBe('none');
            const actualHTML = $('#farmnews-evolutions .scrollable').children();
            internalTrim(actualHTML);
            /* "New" Categories and Expected Pokemon in each
               - Error (L877)
                 - ABC XYZ
               - Error (L936)
                 - ABC XYZ
               - Error (L995)
                 - ABC XYZ
               - Error (L1054)
                 - ABC XYZ */
            /* New Categories summarized (which is how they'll appear in the HTML):
               - Error
                 - ABC XYZ */
            expect(actualHTML.equivalent(expectedHTML)).toBeTruthy();
        });

        it('Test the error case where a melanistic pokemon with a name that doens\'t meet any criteria is found in the dex', () => {
            const htmlpath = path.join(__dirname, '../data/', 'farmWithFakeMelanisticPokemon.html');
            const html = fs.readFileSync(htmlpath, 'utf8', 'r');
            const innerHTML = html.replace(/<html .*?>/, '').replace(/<\/html>/, '').trim();
            global.location.href = 'https://pokefarm.com/farm#tab=1';
            document.documentElement.innerHTML = innerHTML;

            const expectedPath = path.join(__dirname, '../data/', 'farmListSortedOnNewErrorMelanistic.html');
            const expectedObjects = $($.parseHTML(fs.readFileSync(expectedPath, 'utf8', 'r').trim()));
            const expectedHTML = expectedObjects.filter('ul');
            // need to remove all the internal whitespace
            internalTrim(expectedHTML);
            // remove comments
            removeComments(expectedHTML);

            // load pokedex that has a fake pokemon in it named "ABC XYZ"
            const incompleteDexPath = path.join(__dirname, '../data/', 'dex_modified6.json');
            let incompleteDex = fs.readFileSync(incompleteDexPath, 'utf8', 'r');
            // use today as the date to avoid reloading the dex from the "web" (a file in this case)
            incompleteDex = JSON.parse(incompleteDex);
            incompleteDex[0] = (new Date()).toUTCString();
            incompleteDex = JSON.stringify(incompleteDex);
            localStorage.setItem(dexKey, incompleteDex);

            localStorage.setItem(key, JSON.stringify(initialFarmSettings));

            new pfqol.pfqol($);

            expect(localStorage.getItem(dexKey)).toBe(incompleteDex);

            /* test the part of the '#qolevolvenew' click handler that works with pokemon
               that have not been seen */
            $('#qolevolvenew').trigger('click');

            expect($('.qolEvolveNewList').length).toBe(1);
            expect($('.evolvepkmnlist').length).toBe(1);
            expect($('.qolEvolveNewList').css('display')).toBe('block');
            expect($('.evolvepkmnlist').css('display')).toBe('none');
            const actualHTML = $('#farmnews-evolutions .scrollable').children();
            internalTrim(actualHTML);
            /* "New" Categories and Expected Pokemon in each
               - Error (L877)
                 - ABC XYZ
               - Error (L936)
                 - ABC XYZ
               - Error (L995)
                 - ABC XYZ
               - Error (L1054)
                 - ABC XYZ */
            /* New Categories summarized (which is how they'll appear in the HTML):
               - Error
                 - ABC XYZ */
            expect(actualHTML.equivalent(expectedHTML)).toBeTruthy();
        });
    });

});
