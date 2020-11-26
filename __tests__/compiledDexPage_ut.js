const jQuery = require('../__mocks__/jquery_files').jQuery;
const console = require('../__mocks__/console_suppress').console;
const fs = require('fs')
const path = require('path')

const pfqol = require('./compiled');

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

describe("Test Dex Page", () => {
    test("Test controls on Dex page", () => {
        const htmlpath = path.join(__dirname, './data/', 'dex.html');
        const html = fs.readFileSync(htmlpath, 'utf8', 'r');
        const innerHTML = html.replace(/<html .*?>/, '').replace(/<\/html>/, '').trim();
        global.location.href = "https://pokefarm.com/dex";
        document.documentElement.innerHTML = innerHTML;

        localStorage.setItem('QoLDex', '{}');

        pfqol.pfqol(jQuery);

        // trigger MutationObserver
        $('#regionslist .region-entries li.entry').eq(0).remove();

        // mimic click outside the types list
        const types2Span = $('.filter-type-2 .types');
        const type2 = $('.filter-type-2');
        let event = jQuery.Event("mousedown.dextfilter");
        event.originalEvent = {
            preventDefault: () => { return true; }
        };
        types2Span.offset({
            top: 0,
            left: 462.5
        });
        types2Span.width(162);
        event.pageX = 511;
        type2.trigger(event);

        // mimic click inside the types list to enable 2nd type search
        event = jQuery.Event("mousedown.dextfilter");
        event.originalEvent = {
            preventDefault: () => { return true; }
        };
        types2Span.offset({
            top: 0,
            left: 462.5
        });
        types2Span.width(162);
        event.pageX = 160;
        type2.trigger(event);

        // mimic second click inside the types list to disable 2nd tyep search
        event = jQuery.Event("mousedown.dextfilter");
        event.originalEvent = {
            preventDefault: () => { return true; }
        };
        types2Span.offset({
            top: 0,
            left: 462.5
        });
        types2Span.width(162);
        event.pageX = 160;
        type2.trigger(event);

        // select a type in the first type list
        const types1Span = $('.filter-type:not(.filter-type-2) .types');
        const normal = types1Span.children().eq(0);
        normal.addClass("selected");
        // mimic click inside the types list to enable 2nd type search
        event = jQuery.Event("mousedown.dextfilter");
        event.originalEvent = {
            preventDefault: () => { return true; }
        };
        types2Span.offset({
            top: 0,
            left: 462.5
        });
        types2Span.width(162);
        event.pageX = 160;
        type2.trigger(event);
        
        // // mimic click outside the types list
        // const types2Span = $('.filter-type-2 .types');
        // const type2 = $('.filter-type-2');
        // let event = jQuery.Event("mousedown.dextfilter");
        // event.originalEvent = {
        //     preventDefault: () => { return true; }
        // };
        // types2Span.offset({
        //     top: 0,
        //     left: 462.5
        // });
        // types2Span.width(162);
        // event.pageX = 511;
        // type2.trigger(event);
    });
});