const QoLHubBase = require('../requires/common/qolHub').QoLHubBase;
const QoLHub = require('../requires/user/qolHub').QoLHub;
const jQuery = require('../../__mocks__/jquery').jQuery;
const fs = require('fs');
const path = require('path');

const ownerDocument = document.implementation.createHTMLDocument('virtual');

describe('Build and close QoL Hub', () => {
    test('Should build QoL Hub when CSS is empty and then close QoL Hub', () => {
        const filepath = path.join(__dirname, '../data/', 'qolHubHTML.html');
        const qolHubHTML = fs.readFileSync(filepath, 'utf8', 'r');
        const templates = {
            qolHubHTML: qolHubHTML
        };
        const globals = {
            DEX_UPDATE_DATE: 'Fri, 30 Oct 2020 22:10:03 GMT',
            TEMPLATES: templates,
        };
        const qol = new QoLHub(jQuery, globals);
        qol.build(ownerDocument);
        qol.close(ownerDocument);
        expect(jQuery('.dialog', ownerDocument).length).toBe(0);
        expect(jQuery('#core', ownerDocument).hasClass('scrolllock')).toBe(false);
    });
    test('Should build QoL Hub when CSS is not empty and then close QoL Hub', () => {
        const filepath = path.join(__dirname, '../data/', 'qolHubHTML.html');
        const qolHubHTML = fs.readFileSync(filepath, 'utf8', 'r');
        const templates = {
            qolHubHTML: qolHubHTML
        };
        const globals = {
            DEX_UPDATE_DATE: 'Fri, 30 Oct 2020 22:10:03 GMT',
            TEMPLATES: templates,
        };
        const variables = {
            userSettings: {
                customCss: 'css'
            }
        };
        const qol = new QoLHub(jQuery, globals, null, variables.userSettings);
        qol.build(ownerDocument);
        qol.close(ownerDocument);
        expect(jQuery('.dialog', ownerDocument).length).toBe(0);
        expect(jQuery('#core', ownerDocument).hasClass('scrolllock')).toBe(false);
    });
});

describe('Handle update dex click', () => {
    test('Should handle update dex click', () => {
        const globals = {
            TYPE_LIST: ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy']
        };
        const htmlpath = path.join(__dirname, '../data/', 'qolHubHTML.html');
        const html = fs.readFileSync(htmlpath, 'utf8', 'r');
        const innerHTML = html.replace(/<html .*?>/, '').replace(/<\/html>/, '').trim();
        global.location.href = 'https://pokefarm.com/party';
        document.documentElement.innerHTML = innerHTML;
        const ownerDocument = document; //.implementation.createHTMLDocument('virtual');;
        const qol = new QoLHub(jQuery, globals, null, null);
        qol.handleUpdateDexClick(ownerDocument);
    });
});