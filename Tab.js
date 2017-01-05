"use strict";

var Core = require("lapis-core");
var Page = require("./Page.js");


module.exports = Core.Base.clone({
    id: "Tab",
    label: null,                    // Text label of button
    visible: true,                  // Whether or not this tab is shown (defaults to true)
    purpose: "Collection of page sections shown at the same time",
});


module.exports.register("click");


module.exports.define("render", function (parent_elmt) {
    var that = this;
    var css_class = this.getCSSClass();
    if (parent_elmt) {
        this.element = parent_elmt.makeElement("li");
    } else {
        this.element.empty();
    }
    this.element.attr("class", css_class);
    this.element.attr("role", "presentation");
    this.element.makeElement("a").text(this.label);
    this.element.jquery_elem.bind("click", function (event) {
        that.click(event);
    });
});


module.exports.define("click", function (event) {
    this.happen("click", event);
});


module.exports.defbind("movetoTab", "click", function (event) {
    this.owner.page.moveToTab(this.id);
    this.owner.page.render();
});


module.exports.define("getCSSClass", function () {
    var css_class = "";
    if (this.owner.page.current_tab === this) {
        css_class = "active";
    }
    if (!this.visible) {
        css_class += " hidden";
    }
    return css_class;
});


module.exports.define("getJSON", function () {
    var out = {};
    out.id = this.id;
    out.label = this.label;
    return out;
});


/**
* Create a new tab object in the owning page, using the spec properties supplied
* @param Spec object whose properties will be given to the newly-created tab
* @return Newly-created tab object
*/
Page.tabs.override("add", function (spec) {
    var tab;
    if (!spec.label) {
        this.throwError("Tab label must be specified in spec");
    }
    tab = module.exports.clone(spec);
    Core.OrderedMap.add.call(this, tab);
    return tab;
});
