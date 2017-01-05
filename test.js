"use strict";

var UI = require(".");


module.exports.Page_main = function (test) {
    var page;
    var page2;

    test.expect(27);

    function getPage(page_id) {
        return UI.Page.getPage(page_id).clone({
            id: page_id,
            instance: true,
            // data_manager: this.data_manager,
            selectors: {},
        });
    }

    page = getPage("example");
    test.equal(page.id, "example", "page id is 'example'");
    test.equal(page.toString(), "/Base/Page/example/example", "page toString() is '/Base/Page/example/example'");
    test.equal(page.active, true, "page is active");
    test.equal(typeof page.page_key, "undefined", "page_key is undefined");
    test.equal(page.tabs.length(), 2, "example page has 2 tabs");
    test.equal(page.sections.length(), 4, "example page has 4 sections");
    test.equal(page.sections.get(0).id, "sect_a", "example page section 0 id = 'sect_a'");
    test.equal(page.sections.get(0).type, UI.Section, "example page section 0 type = UI.Section");
    test.equal(page.sections.get(0).tab, "tab1", "example page section 0 tab = tab1");
    test.equal(page.sections.get(0).entity, undefined, "example page section 0 entity = undefined");
    test.equal(page.links.length(), 1, "example page has 1 link");
    test.equal(page.links.get(0).id, "home", "example page link 0 id = 'home'");
    test.equal(page.links.get(0).page_to, "home", "example page link 0 page_to = 'home'");
    test.equal(page.buttons.length(), 2, "example page has 2 buttons");
    page.cancel();
    test.equal(page.active, false, "page is not active after cancel");

    page2 = getPage("example");
    test.equal(page.active, false, "page is not active after cancel");
    test.equal(page2.active, true, "new page is active after getPage()");

    test.equal(page2.current_tab.id, "tab1", "new page's current tab is tab1'");
    test.equal(page2.buttons.get("prev_tab").visible, false, "previous button is not visible");
    test.equal(page2.buttons.get("next_tab").visible, true, "previous button is not visible");

    page2.buttons.get("next_tab").click();
    test.equal(page2.current_tab.id, "tab2", "after clicking on next button, page's current tab is tab2'");
    test.equal(page2.buttons.get("prev_tab").visible, true, "previous button is not visible");
    test.equal(page2.buttons.get("next_tab").visible, false, "previous button is not visible");

    page2.tabs.get("tab1").click();
    test.equal(page2.current_tab.id, "tab1", "after clicking on tab1, page's current tab is tab1'");
    test.equal(page2.buttons.get("prev_tab").visible, false, "previous button is not visible");
    test.equal(page2.buttons.get("next_tab").visible, true, "previous button is not visible");

    test.equal(page2.getSimpleURL(), "index.html#page_id=example", "getSimpleURL() returns 'index.html#page_id=example'");

    test.done();
};


/*
module.exports.XmlStream_main = function (test) {
    var xmlstream = UI.XmlStream.clone({ id: "div", });
    var elmt;

    test.expect(1);
    elmt = xmlstream.addChild("blah");
    elmt.attr("foo", "bar");
    elmt.text("sfgh");
    elmt.addChild("hoow");
    xmlstream.close();
    test.equal(xmlstream.out.collector, "<div><blah foo='bar'>sfgh<hoow/></blah></div>");
    test.done();
};

module.exports.XmlStream_errors = function (test) {
    var xmlstream = UI.XmlStream.clone({ id: "div", });
    var elmt;

    test.expect(4);
    elmt = xmlstream.addChild("blah");
    test.throws(function () { xmlstream.attr("a", "b"); }, "set attr after child added");
    xmlstream.addChild("blah2");
    test.throws(function () { elmt.addChild("foo"); }, "add child after subsequent sibling added");
    test.throws(function () { elmt.text("sldjkfh"); }, "add text after subsequent sibling added");

    xmlstream.close();
    test.throws(function () { xmlstream.close(); }, "close() after already closed");

    test.done();
};
*/
