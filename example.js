"use strict";

var Page = require("./Page.js");
var Section = require("./Section.js");


module.exports = Page.clone({
    id: "example",
    title: "Example",
    tab_sequence: true,
    security: { all: true, },
});


module.exports.tabs.addAll([
    {
        id: "tab1",
        label: "Tab 1",
    },
    {
        id: "tab2",
        label: "Tab 2",
    },
]);


module.exports.sections.addAll([
    {
        id: "sect_a",
        title: "Section A",
        type: Section,
        tab: "tab1",
        text: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias.",
    },
    {
        id: "sect_b",
        title: "Section B",
        type: Section,
        tab: "tab1",
        text: "Excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.",
    },
    {
        id: "sect_c",
        title: "Section C",
        type: Section,
        tab: "tab2",
        text: "Et harum quidem rerum facilis est et expedita quod maxime placeat distinctio.",
    },
    {
        id: "sect_d",
        title: "Section D",
        type: Section,
        tab: "tab2",
        text: "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.",
    },
]);


module.exports.links.addAll([
    {
        id: "home",
        page_to: "home",
    },
]);


module.exports.defbind("setupEnd", "setupEnd", function () {
    var that = this;
    this.setTitle("Welcome, Jerry Lee Lewis");
    this.setDescription("and Happy Christmas!");
    this.debug("setting title and descr... ");
    this.buttons.get("prev_tab").confirm_text = "Are you sure you want to go backwards?";
    setTimeout(function () {
        that.setTitle("Surprised You!");
    }, 1000);
});

