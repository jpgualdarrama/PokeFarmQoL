/* globals Page Helpers */
const ShelterBase = Page;
    
// eslint-disable-next-line no-unused-vars
class ShelterPage extends ShelterBase {
    constructor(jQuery, GLOBALS) {
        super(jQuery, 'QoLShelter', {
            findCustom: '',
            findType: '',
            findTypeEgg: true,
            findTypePokemon: false,
            findNewEgg: true,
            findNewPokemon: true,
            findShiny: true,
            findAlbino: true,
            findMelanistic: true,
            findPrehistoric: true,
            findDelta: true,
            findMega: true,
            findStarter: true,
            findCustomSprite: true,
            findReadyToEvolve: false,
            findMale: true,
            findFemale: true,
            findNoGender: true,
            findNFE: false,
            customEgg: true,
            customPokemon: true,
            customPng: false,
            shelterGrid: true,
        }, '/shelter');
        this.customArray = [];
        this.typeArray = [];
        const obj = this;
        this.observer = new MutationObserver(function(mutations) {
            // eslint-disable-next-line no-unused-vars
            mutations.forEach(function(mutation) {
                obj.customSearch(GLOBALS);
            });
        });

        // when the page is loaded, check to see if the data needed for finding eggs by type is loaded (if it's needed)
        if(this.onPage(window) &&
           this.settings.findTypeEgg &&
           !(GLOBALS.EGGS_PNG_TO_TYPES_LIST || JSON.parse(localStorage.getItem('QoLEggTypesMap')))) {
            window.alert('Message from QoL script:\nUnable to load list of pokemon eggs and their types, ' +
                         'which is used to distinguish eggs with the same name but different types (Vulpix and ' +
                         'Alolan Vulpix).\n\nCan still find eggs by type, but there may be mistakes. ' +
                         'Please clear and reload your pokedex data by clicking the "Clear Cached Dex" '+
                         'and then clicking the "Update Pokedex" button in the QoL Hub to load list of eggs and types.');
        }
        
        // used to keep track of the currently selected match
        // matches can be selected via a shortcut key, specified via this.selectNextMatchKey
        this.selectNextMatchKey = 78; // 'n'
        this.currentlySelectedMatch = undefined;
    }

    setupHTML(GLOBALS) {
        this.jQuery('.tabbed_interface.horizontal>div').removeClass('tab-active');
        this.jQuery('.tabbed_interface.horizontal>ul>li').removeClass('tab-active');
        document.querySelector('.tabbed_interface.horizontal>ul').insertAdjacentHTML('afterbegin', '<li class="tab-active"><label>Search</label></li>');
        document.querySelector('.tabbed_interface.horizontal>ul>li').insertAdjacentHTML('afterend', '<li class=""><label>Sort</label></li>');
        document.querySelector('.tabbed_interface.horizontal>ul').insertAdjacentHTML('afterend', GLOBALS.TEMPLATES.shelterOptionsHTML);
        document.querySelector('#shelteroptionsqol').insertAdjacentHTML('afterend', '<div id="qolsheltersort"><label><input type="checkbox" class="qolsetting" data-key="shelterGrid"/><span>Sort by Grid</span></label>');
        this.jQuery('#shelteroptionsqol').addClass('tab-active');

        document.querySelector('#sheltercommands').insertAdjacentHTML('beforebegin', '<div id="sheltersuccess"></div>');

        const theField = Helpers.textSearchDiv('numberDiv', 'findCustom', 'removeShelterTextfield', 'customArray');
        const theType = Helpers.selectSearchDiv('typeNumber', 'types', 'findType', GLOBALS.TYPE_OPTIONS,
            'removeShelterTypeList', 'fieldTypes', 'typeArray');

        this.customArray = this.settings.findCustom.split(',');
        this.typeArray = this.settings.findType.split(',');

        Helpers.setupFieldArrayHTML(this.jQuery, this.customArray, 'searchkeys', theField, 'numberDiv');
        Helpers.setupFieldArrayHTML(this.jQuery, this.typeArray, 'shelterTypes', theType, 'typeNumber');

        this.jQuery('[data-shelter=reload]').addClass('customSearchOnClick');
        this.jQuery('[data-shelter=whiteflute]').addClass('customSearchOnClick');
        this.jQuery('[data-shelter=blackflute]').addClass('customSearchOnClick');
    }
    setupCSS() {
        let shelterSuccessCss = this.jQuery('#sheltercommands').css('background-color');
        this.jQuery('#sheltersuccess').css('background-color', shelterSuccessCss);
    }
    setupObserver() {
        this.observer.observe(document.querySelector('#shelterarea'), {
            childList: true,
        });
    }
    setupHandlers(GLOBALS) {
        const obj = this;
        this.jQuery(document).on('change', '#shelteroptionsqol input', (function() { //shelter search
            obj.loadSettings();
            obj.customSearch(GLOBALS);
            obj.saveSettings();
        }));

        this.jQuery(document).on('change', '.qolsetting', (function() {
            obj.loadSettings();
            obj.customSearch(GLOBALS);
            obj.saveSettings();
        }));

        this.jQuery(document).on('input', '.qolsetting', (function() { //Changes QoL settings
            obj.settingsChange(this.getAttribute('data-key'),
                obj.jQuery(this).val(),
                obj.jQuery(this).parent().parent().attr('class'),
                obj.jQuery(this).parent().attr('class'),
                (this.hasAttribute('array-name') ? this.getAttribute('array-name') : ''));
            obj.customSearch(GLOBALS);
            obj.saveSettings();
        }));

        this.jQuery('.customSearchOnClick').on('click', (function() {
            obj.loadSettings();
            obj.customSearch(GLOBALS);
            obj.saveSettings();
        }));

        this.jQuery(document).on('click', '#addShelterTextfield', (function() { //add shelter text field
            obj.addTextField();
            obj.saveSettings();
        }));

        this.jQuery(document).on('click', '#removeShelterTextfield', (function() { //remove shelter text field
            obj.removeTextField(this, obj.jQuery(this).parent().find('input').val());
            obj.saveSettings();
            obj.customSearch(GLOBALS);
        }));

        this.jQuery(document).on('click', '#addShelterTypeList', (function() { //add shelter type list
            obj.addTypeList(GLOBALS);
            obj.customSearch(GLOBALS);
        }));

        this.jQuery(document).on('click', '#removeShelterTypeList', (function() { //remove shelter type list
            obj.removeTypeList(this, obj.jQuery(this).parent().find('select').val());
            obj.saveSettings();
            obj.customSearch(GLOBALS);
        }));

        this.jQuery(window).on('keyup.qol_shelter_shortcuts', function (a) {
            if (0 == obj.jQuery(a.target).closest('input, textarea').length) {
                switch (a.keyCode) {
                case obj.selectNextMatchKey:
                    var numMatches = obj.jQuery('#shelterarea').find('.pokemon').find('.shelterfoundme').length;

                    // remove all existing locks
                    obj.jQuery('#shelterarea').find('.pokemon').removeClass('lock').removeClass('dismiss');

                    // default is undefined, so set the value to either 0 or 1+current
                    obj.currentlySelectedMatch = (obj.currentlySelectedMatch + 1) || 0;

                    if(numMatches) {
                        var modIndex = (numMatches == 1) ? 0 : (obj.currentlySelectedMatch + 1) % numMatches - 1;
                        var selected = obj.jQuery('#shelterarea').find('.pokemon').find('.shelterfoundme').parent().eq(modIndex);
                        // these steps mimic clicking on the pokemon/egg
                        selected.parent().addClass('selected');
                        selected.addClass('tooltip_trigger').addClass('lock').removeClass('dismiss');
                        selected.next().find('[data-shelter=adopt]').focus();
                    } else {
                        obj.currentlySelectedMatch = undefined;
                    }
                }
            }
        });
    }
    addTextField() {
        const theField = Helpers.textSearchDiv('numberDiv', 'findCustom', 'removeShelterTextfield', 'customArray');
        let numberDiv = this.jQuery('#searchkeys>div').length;
        this.jQuery('#searchkeys').append(theField);
        this.jQuery('.numberDiv').removeClass('numberDiv').addClass(''+numberDiv+'');
    }
    removeTextField(byebye, key) {
        this.customArray = this.jQuery.grep(this.customArray, function(value) { //when textfield is removed, the value will be deleted from the localstorage
            return value != key;
        });
        this.settings.findCustom = this.customArray.toString();

        this.jQuery(byebye).parent().remove();

        let i;
        for(i = 0; i < this.jQuery('#searchkeys>div').length; i++) {
            let rightDiv = i + 1;
            this.jQuery('.'+i+'').next().removeClass().addClass(''+rightDiv+'');
        }
    }
    addTypeList(GLOBALS) {
        const theList = Helpers.selectSearchDiv('typeNumber', 'types', 'findType', GLOBALS.TYPE_OPTIONS,
            'removeShelterTypeList', 'fieldTypes', 'typeArray');
        let numberTypes = this.jQuery('#shelterTypes>div').length;
        this.jQuery('#shelterTypes').append(theList);
        this.jQuery('.typeNumber').removeClass('typeNumber').addClass(''+numberTypes+'');
    }
    removeTypeList(byebye, key) {
        this.typeArray = this.jQuery.grep(this.typeArray, function(value) {
            return value != key;
        });
        this.settings.findType = this.typeArray.toString();

        this.jQuery(byebye).parent().remove();

        let i;
        for(i = 0; i < this.jQuery('#shelterTypes>div').length; i++) {
            let rightDiv = i + 1;
            this.jQuery('.'+i+'').next().removeClass().addClass(''+rightDiv+'');
        }
    }
    insertShelterFoundDiv(number, name, img) {
        document.querySelector('#sheltersuccess').
            insertAdjacentHTML('beforeend',
                '<div id="shelterfound">' + name + ((number !== 1) ? 's' : '') + ' found ' + img + '</div>');
    }
    insertShelterTypeFoundDiv(number, type, stage, names) {
        let stageNoun = '';
        if (stage === 'egg') {
            stageNoun = stage + (number !== 1 ? 's' : '');
        } else { // i.e. stage === 'Pokemon'
            stageNoun = stage;
        }
        document.querySelector('#sheltersuccess').
            insertAdjacentHTML('beforeend',
                '<div id="shelterfound">' + number + ' ' + type + ' type ' +
                               stageNoun + ' found!' + (names.length > 0 ? '(' + names.toString() + ')' : '') + '</div>');
    }
    
    searchForImgTitle(GLOBALS, key) {
        const SEARCH_DATA = GLOBALS.SHELTER_SEARCH_DATA;
        const keyIndex = SEARCH_DATA.indexOf(key);
        const value = SEARCH_DATA[keyIndex + 1];
        const selected = this.jQuery('img[title*="'+value+'"]');
        if (selected.length) {
            let searchResult = SEARCH_DATA[keyIndex + 2]; //type of Pokémon found
            let imgResult = selected.length + ' ' + searchResult; //amount + type found
            let imgFitResult = SEARCH_DATA[keyIndex + 3]; //image for type of Pokémon
            let shelterBigImg = selected.parent().prev().children('img.big');
            this.jQuery(shelterBigImg).addClass('shelterfoundme');

            this.insertShelterFoundDiv(selected.length, imgResult, imgFitResult);
        }
    }

    searchForReadyToEvolveByLevel(GLOBALS) {
        const obj = this;
        let selected = this.jQuery('#shelterarea .tooltip_content');
        let readyBigImg = [];
        selected.each((idx, s) => {
            let text = s.textContent.split(' ');
            let name = text[0];
            let level = parseInt(text[1].substring(4));

            // get level that pokemon needs to be at to evolve
            let evolveLevel = undefined;
            if(GLOBALS.EVOLVE_BY_LEVEL_LIST[name] !== undefined) {
                evolveLevel = parseInt(GLOBALS.EVOLVE_BY_LEVEL_LIST[name].split(' ')[1]);
            }

            if(evolveLevel !== undefined && level >= evolveLevel) {
                let shelterBigImg = obj.jQuery(s).prev().children('img.big');
                readyBigImg.push(shelterBigImg);
            }
        });

        for(let i = 0; i < readyBigImg.length; i++) {
            this.jQuery(readyBigImg[i]).addClass('shelterfoundme');
        }

        let imgResult = readyBigImg.length + ' ' + 'ready to evolve';
        this.insertShelterFoundDiv(readyBigImg.length, imgResult, '');

    }

    highlightByHowFullyEvolved(GLOBALS, pokemonElem) {
        // if a pokemon is clicked-and-dragged, the tooltip element after the pokemon
        // will not exist. If this occurs. don't try highlighting anything until the
        // pokemon is "put down"
        if(!this.jQuery(pokemonElem).next().length) { return; }

        const tooltipElem = this.jQuery(pokemonElem).next()[0];
        const tooltip = {
            species: tooltipElem.textContent.split(' ')[0],
            forme: ''
        };
        let pokemon = tooltip['species'];

        if(GLOBALS.EVOLUTIONS_LEFT !== undefined && GLOBALS.EVOLUTIONS_LEFT !== null) {
            const evolutionData = GLOBALS.EVOLUTIONS_LEFT;
            // if can't find the pokemon directly, try looking for its form data
            if(!evolutionData[pokemon]) {
                if(tooltip['forme']) {
                    pokemon = pokemon + ' [' + tooltip['forme'] + ']';
                }
            }
            if(!evolutionData[pokemon]) {
                // Do not log error here. Repeated errors can (will) slow down the page
                // console.error(`Private Fields Page - Could not find evolution data for ${pokemon}`);
            } else {
                const evolutionsLeft = evolutionData[pokemon].remaining;

                if(evolutionsLeft === 1) {
                    this.jQuery(pokemonElem).children('img.big').addClass('oneevolutionleft');
                } else if(evolutionsLeft === 2) {
                    this.jQuery(pokemonElem).children('img.big').addClass('twoevolutionleft');
                }
            }
        } else {
            console.error('Unable to load evolution data. In QoL Hub, please clear cached dex and reload dex data');
        }
    }

    customSearch(GLOBALS) {
        const obj = this;
        const SEARCH_DATA = GLOBALS.SHELTER_SEARCH_DATA;
        
        let dexData = GLOBALS.DEX_DATA;
        // search whatever you want to find in the shelter & grid

        //sort in grid
        this.jQuery('#shelterarea').removeClass('qolshelterareagrid');
        this.jQuery('.mq2 #shelterarea').removeClass('qolshelterareagridmq2');
        this.jQuery('#shelterarea .tooltip_content').removeClass('qoltooltipgrid');
        this.jQuery('#shelterpage #shelter #shelterarea > .pokemon').removeClass('qolpokemongrid');
        this.jQuery('#sheltergridthingy').remove();

        if (this.settings.shelterGrid === true) { //shelter grid
            this.jQuery('#shelterarea').addClass('qolshelterareagrid');
            this.jQuery('.mq2 #shelterarea').addClass('qolshelterareagridmq2');
            this.jQuery('#shelterarea .tooltip_content').addClass('qoltooltipgrid');
            this.jQuery('#shelterpage #shelter #shelterarea > .pokemon').addClass('qolpokemongrid');
            // this.jQuery('#shelterpage #shelter #shelterarea:before').css({'display' : 'none!important'});
            // this.jQuery('<pseudo:before>').attr('style', 'display: none!important');
            this.jQuery('head').append('<style id="sheltergridthingy">#shelterarea:before{display:none !important;}</style>');
        }

        //search values depending on settings
        //emptying the sheltersuccess div to avoid duplicates
        document.querySelector('#sheltersuccess').innerHTML='';
        this.jQuery('#shelterarea>div>img').removeClass('shelterfoundme');

        if(this.settings.findShiny === true) {
            this.searchForImgTitle(GLOBALS, 'findShiny');
        }
        if(this.settings.findAlbino === true) {
            this.searchForImgTitle(GLOBALS, 'findAlbino');
        }
        if(this.settings.findMelanistic === true) {
            this.searchForImgTitle(GLOBALS, 'findMelanistic');
        }
        if(this.settings.findPrehistoric === true) {
            this.searchForImgTitle(GLOBALS, 'findPrehistoric');
        }
        if(this.settings.findDelta === true) {
            this.searchForImgTitle(GLOBALS, 'findDelta');
        }
        if(this.settings.findMega === true) {
            this.searchForImgTitle(GLOBALS, 'findMega');
        }
        if(this.settings.findStarter === true) {
            this.searchForImgTitle(GLOBALS, 'findStarter');
        }
        if(this.settings.findCustomSprite === true) {
            this.searchForImgTitle(GLOBALS, 'findCustomSprite');
        }
        if(this.settings.findNFE === true) {
            this.jQuery('#shelterarea>[data-stage=pokemon]').each(function() {
                obj.highlightByHowFullyEvolved(GLOBALS, this);
            });
        } else {
            this.jQuery('.oneevolutionleft').each((k, v) => {
                obj.jQuery(v).removeClass('oneevolutionleft');
            });
            this.jQuery('.twoevolutionleft').each((k, v) => {
                obj.jQuery(v).removeClass('twoevolutionleft');
            });
        }

        if(this.settings.findNewPokemon === true) {
            let key = 'findNewPokemon';
            let value = SEARCH_DATA[SEARCH_DATA.indexOf(key) + 1];
            let selected = this.jQuery('#shelterarea .tooltip_content:contains(' + value + ')');
            if (selected.length) {
                let searchResult = SEARCH_DATA[SEARCH_DATA.indexOf(key) + 2];
                let imgFitResult = SEARCH_DATA[SEARCH_DATA.indexOf(key) + 3];
                let tooltipResult = selected.length+' '+searchResult;
                let shelterImgSearch = selected;
                let shelterBigImg = shelterImgSearch.prev().children('img.big');
                this.jQuery(shelterBigImg).addClass('shelterfoundme');
                
                this.insertShelterFoundDiv(selected.length, tooltipResult, imgFitResult);
            }
        }

        if(this.settings.findNewEgg === true) {
            let key = 'findNewEgg';
            let value = SEARCH_DATA[SEARCH_DATA.indexOf(key) + 1];
            let selected = this.jQuery('#shelterarea .tooltip_content:contains(' + value + ')').filter(function(){
                // .text() will include the text in the View/Adopt and Hide buttons, so there will be a space
                return obj.jQuery(this).text().startsWith(value + ' ');
            });

            if (selected.length) {
                let searchResult = SEARCH_DATA[SEARCH_DATA.indexOf(key) + 2];
                let imgFitResult = SEARCH_DATA[SEARCH_DATA.indexOf(key) + 3];
                if (selected.length >= 1) {
                    let shelterImgSearch = selected;
                    let shelterBigImg = shelterImgSearch.prev().children('img.big');
                    this.jQuery(shelterBigImg).addClass('shelterfoundme');
                }
                this.insertShelterFoundDiv(selected.length, searchResult, imgFitResult);
            }
        }

        if(this.settings.findReadyToEvolve === true) {
            if(GLOBALS.EVOLVE_BY_LEVEL_LIST === null) {
                window.alert('Unable to load list of pokemon that can evolve by level. Please try updating dex ' +
                             'by clicking "Update Pokedex" in the QoL Hub. If the problem persists, please post in the thread.\n\n' +
                             'Disabling this function until the checkbox is clicked again');
                this.settings.findReadyToEvolve = false;
                // uncheck checkbox
                this.jQuery('[data-key=findReadyToEvolve]')[0].checked = false;
            } else {
                this.searchForReadyToEvolveByLevel(GLOBALS);
            }
        }
        
        //loop to find all search genders for the custom
        const shelterValueArrayCustom = [];
        for (let key in this.settings) {
            let value = this.settings[key];
            if (value === true) {
                if(key === 'findMale' || key === 'findFemale' || key === 'findNoGender') {
                    let searchKey = GLOBALS.SHELTER_SEARCH_DATA[GLOBALS.SHELTER_SEARCH_DATA.indexOf(key) + 1];
                    shelterValueArrayCustom.push(searchKey);
                }
            }
        }

        //loop to find all the custom search parameters
        let customSearchAmount = this.customArray.length;
        const heartPng = '<img src="//pfq-static.com/img/pkmn/heart_1.png/t=1427152952">';
        const eggPng = '<img src="//pfq-static.com/img/pkmn/egg.png/t=1451852195">';
        for (let i = 0; i < customSearchAmount; i++) {
            let customValue = this.customArray[i];
            if (customValue != '') {
                //custom pokemon search
                if (this.settings.customPokemon === true) {
                    let genderMatches = [];
                    if (shelterValueArrayCustom.indexOf('[M]') > -1) {
                        genderMatches.push('[M]');
                    }
                    if(shelterValueArrayCustom.indexOf('[F]') > -1) {
                        genderMatches.push('[F]');
                    }
                    if(shelterValueArrayCustom.indexOf('[N]') > -1) {
                        genderMatches.push('[N]');
                    }

                    if(genderMatches.length > 0) {
                        for(let i = 0; i < genderMatches.length; i++) {
                            let genderMatch = genderMatches[i];
                            let selected = this.jQuery('#shelterarea .tooltip_content:containsIN('+customValue+') img[title*=\'' + genderMatch + '\']');
                            if (selected.length) {
                                let searchResult = customValue;
                                let genderName = GLOBALS.SHELTER_SEARCH_DATA[GLOBALS.SHELTER_SEARCH_DATA.indexOf(genderMatch) + 1];
                                let imgGender = GLOBALS.SHELTER_SEARCH_DATA[GLOBALS.SHELTER_SEARCH_DATA.indexOf(genderMatch) + 2];
                                let tooltipResult = selected.length + ' ' + genderName + imgGender + ' ' + searchResult;
                                let shelterImgSearch = selected;
                                let shelterBigImg = shelterImgSearch.parent().prev().children('img.big');
                                this.jQuery(shelterBigImg).addClass('shelterfoundme');

                                this.insertShelterFoundDiv(selected.length, tooltipResult, heartPng);
                            }
                        }
                    }

                    //No genders
                    else if (shelterValueArrayCustom.length === 0) {
                        let selected = this.jQuery('#shelterarea .tooltip_content:containsIN('+customValue+'):not(:containsIN("Egg"))');
                        if (selected.length) {
                            let searchResult = customValue;
                            let tooltipResult = selected.length + ' ' + searchResult;
                            let shelterImgSearch = selected;
                            let shelterBigImg = shelterImgSearch.parent().prev().children('img.big');
                            this.jQuery(shelterBigImg).addClass('shelterfoundme');
                            this.insertShelterFoundDiv(selected.length, tooltipResult, heartPng);
                        }
                    }
                }

                //custom egg
                if (this.settings.customEgg === true) {
                    let selected = this.jQuery('#shelterarea .tooltip_content:containsIN('+customValue+'):contains("Egg")');
                    if (selected.length) {
                        let searchResult = customValue;
                        let tooltipResult = selected.length + ' ' + searchResult;
                        let shelterImgSearch = selected;
                        let shelterBigImg = shelterImgSearch.prev().children('img.big');
                        this.jQuery(shelterBigImg).addClass('shelterfoundme');
                        this.insertShelterFoundDiv(selected.length, tooltipResult, eggPng);
                    }
                }

                //imgSearch with Pokémon
                if (this.settings.customPng === true) {
                    let selected = this.jQuery('#shelterarea img.big[src*="'+customValue+'"]');
                    if (selected.length) {
                        let searchResult = selected.parent().next().text().split('(')[0];
                        let tooltipResult = selected.length+' '+searchResult+' (Custom img search)';
                        let shelterImgSearch = selected;
                        this.jQuery(shelterImgSearch).addClass('shelterfoundme');
                        this.insertShelterFoundDiv(selected.length, tooltipResult, heartPng);
                    }
                }
            }
        }

        //loop to find all the types

        const filteredTypeArray = this.typeArray.filter(v=>v!='');

        if (filteredTypeArray.length > 0) {
            const eggPngsToTypes = GLOBALS.EGGS_PNG_TO_TYPES_LIST ||
                  JSON.parse(localStorage.getItem('QoLEggTypesMap')) || undefined;
            const monPngsToTypes = GLOBALS.POKEMON_PNG_TO_TYPES_LIST ||
                  JSON.parse(localStorage.getItem('QoLPokemonTypesMap')) || undefined;
            for (let i = 0; i < filteredTypeArray.length; i++) {
                let value = filteredTypeArray[i];
                let foundType = GLOBALS.SHELTER_TYPE_TABLE[GLOBALS.SHELTER_TYPE_TABLE.indexOf(value) + 2];

                let typePokemonNames = [];
                let selected = undefined;
                if (this.settings.findTypeEgg === true) {
                    let pokemonElems = [];
                    typePokemonNames = [];
                    selected = this.jQuery('#shelterarea>.tooltip_content:contains("Egg")');
                    selected.each(function() {
                        let searchPokemon = (obj.jQuery(this).text().split(' ')[0]);
                        let searchTypeOne = '';
                        let searchTypeTwo = '';
                        if(eggPngsToTypes) {
                            let imgUrl = obj.jQuery(obj.jQuery(this).prev().find('img')[0]).attr('src').replace('https://pfq-static.com/img/', '');
                            searchTypeOne = eggPngsToTypes[searchPokemon] &&
                                eggPngsToTypes[searchPokemon][imgUrl] &&
                                ('' + eggPngsToTypes[searchPokemon][imgUrl][0]);
                            searchTypeTwo = eggPngsToTypes[searchPokemon] &&
                                eggPngsToTypes[searchPokemon][imgUrl] &&
                                ('' + (eggPngsToTypes[searchPokemon][imgUrl][1] || -1));
                        } else {
                            let searchPokemonIndex = dexData.indexOf('"'+searchPokemon+'"');
                            searchTypeOne = dexData[searchPokemonIndex + 1];
                            searchTypeTwo = dexData[searchPokemonIndex + 2];
                        }
                        if ((searchTypeOne === value) || (searchTypeTwo === value)) {
                            typePokemonNames.push(searchPokemon);
                            pokemonElems.push(this);
                        }
                    });

                    for (let o = 0; o < pokemonElems.length; o++) {
                        let shelterImgSearch = this.jQuery(pokemonElems[o]);
                        let shelterBigImg = shelterImgSearch.prev().children('img.big');
                        this.jQuery(shelterBigImg).addClass('shelterfoundme');
                    }

                    this.insertShelterTypeFoundDiv(typePokemonNames.length, foundType, 'egg', typePokemonNames);
                }

                if (this.settings.findTypePokemon === true) {
                    typePokemonNames = [];
                    selected = this.jQuery('#shelterarea>.tooltip_content').not(':contains("Egg")');
                    selected.each(function() {
                        let searchPokemon = (obj.jQuery(this).text().split(' ')[0]);
                        let searchTypeOne = '';
                        let searchTypeTwo = '';
                        if(monPngsToTypes) {
                            let imgUrl = obj.jQuery(obj.jQuery(this).prev().find('img')[0]).attr('src').replace('https://pfq-static.com/img/', '');
                            searchTypeOne = monPngsToTypes[searchPokemon] &&
                                monPngsToTypes[searchPokemon][imgUrl] &&
                                ('' + monPngsToTypes[searchPokemon][imgUrl][0]);
                            searchTypeTwo = monPngsToTypes[searchPokemon] &&
                                monPngsToTypes[searchPokemon][imgUrl] &&
                                ('' + (monPngsToTypes[searchPokemon][imgUrl][1] || -1));
                        } else {
                            let searchPokemonIndex = dexData.indexOf('"'+searchPokemon+'"');
                            searchTypeOne = dexData[searchPokemonIndex + 1];
                            searchTypeTwo = dexData[searchPokemonIndex + 2];
                        }
                        if ((searchTypeOne === value) || (searchTypeTwo === value)) {
                            typePokemonNames.push(searchPokemon);
                        }
                    });

                    for (let o = 0; o < typePokemonNames.length; o++) {
                        let shelterImgSearch = this.jQuery('#shelterarea .tooltip_content:containsIN(\''+typePokemonNames[o]+' (\')');
                        let shelterBigImg = shelterImgSearch.prev().children('img.big');
                        this.jQuery(shelterBigImg).addClass('shelterfoundme');
                    }

                    this.insertShelterTypeFoundDiv(typePokemonNames.length, foundType, 'Pokemon', typePokemonNames);
                }
            }
        } // filteredTypeArray
    } // customSearch
}
