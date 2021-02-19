const jQuery = require('../../__mocks__/jquery_files').jQuery;
// eslint-disable-next-line no-unused-vars
const console = require('../../__mocks__/console_suppress').console;
const fs = require('fs');
const path = require('path');
const appRoot = require('app-root-path');
const pfqol = require(appRoot + '/__tests__/Poke-Farm-QoL.sanctioned');
const oldWindowLocation = window.location;

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

describe('Test that PFQoL compiles', () => {
    test('Test QoL Hub controls', () => {
        const htmlpath = path.join(__dirname, '../data/', 'party.html');
        const html = fs.readFileSync(htmlpath, 'utf8', 'r');
        const innerHTML = html.replace(/<html .*?>/, '').replace(/<\/html>/, '').trim();
        document.documentElement.innerHTML = innerHTML;
        global.location.href = 'https://pokefarm.com/party';

        // set non-default Shelter settings to facilitate the resetPageSettings test
        localStorage.setItem('QoLShelter', JSON.stringify({
            findCustom: '',
            findType: '',
            findTypeEgg: false, // non-default
            findTypePokemon: true, // non-default
            findNewEgg: false, // non-default
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
        }));

        new pfqol.pfqol(jQuery);

        ////////////////////////////////////////
        // TEST 1
        // check that a div is added to the HTML when the QoL button in the
        // timerse bar is clicked
        jQuery('li[data-name="QoL"]').eq(0).trigger('click');
        let lastChild = jQuery('body').children().eq(-1);
        expect(lastChild && lastChild.attr('class')).toBe('dialog');
        ////////////////////////////////////////

        ////////////////////////////////////////
        // TEST 2
        // check that clicking a checkbox changes a setting
        const settingsList = ['enableDaycare'];
        let expectedSettingValue;
        let settings;
        for (let i = 0; i < settingsList.length; i++) {
            const key = settingsList[i];
            settings = JSON.parse(localStorage.getItem('QoLSettings'));
            if (settings[key] === true) {
                expectedSettingValue = false;
            } else {
                expectedSettingValue = true;
            }
            jQuery(`[data-key=${key}]`).trigger('click');
            settings = JSON.parse(localStorage.getItem('QoLSettings'));
            expect(settings[key]).toEqual(expectedSettingValue);
        }
        ////////////////////////////////////////

        ////////////////////////////////////////
        // this doesn't need any expects; it's not important enough
        jQuery('h3.slidermenu').trigger('click');
        ////////////////////////////////////////

        ////////////////////////////////////////
        // test keydown handler for #qolcustomcss
        let keyevent = jQuery.Event('keydown');
        keyevent.keyCode = 9; // tab
        jQuery('#qolcustomcss').trigger(keyevent);
        keyevent = jQuery.Event('keydown');
        keyevent.keyCode = 0;
        keyevent.which = 9; // tab
        jQuery('#qolcustomcss').trigger(keyevent);
        ////////////////////////////////////////

        ////////////////////////////////////////
        // TEST
        // check that clicking the close button removes the HTML for the dialog
        jQuery('.closeHub').eq(0).trigger('click');
        lastChild = jQuery('body').children().eq(-1);
        expect(lastChild && lastChild.attr('class')).not.toBe('dialog');
        ////////////////////////////////////////
    });
});