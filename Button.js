"use strict";

var Core = require("lapis-core");
var Page = require("./Page.js");


module.exports = Core.Base.clone({
    id: "Button",
    label: null,                         // Text label of button
    visible: true,                         // Whether or not this tab is shown (defaults to true)
    purpose: "Button on this page",
});


module.exports.register("click");


/**
* Generate HTML output for this page button
* @param xmlstream div element object to contain the buttons; render_opts
*/
module.exports.define("render", function (parent_elmt) {
    var that = this;
    var css_class = this.getCSSClass();

    if (parent_elmt) {
        this.element = parent_elmt.makeElement("button");
    } else {
        this.element.empty();
    }
    this.element.attr("class", css_class);
    this.element.text(this.label);
    this.element.jquery_elem.bind("click", function (event) {
        that.click(event);
    });
});


module.exports.define("click", function (event) {
    var go_ahead = true;
    if (this.confirm_text) {
        go_ahead = confirm(this.confirm_text);
    }
    if (go_ahead) {
        this.happen("click", event);
    }
});


module.exports.defbind("doPageFunctClick", "click", function (event) {
    this.debug("click() - page_funct_click? " + this.page_funct_click);
    if (this.page_funct_click) {
        this.owner.page[this.page_funct_click](this.id);
    }
});


module.exports.define("getCSSClass", function () {
    var css_class = "btn css_cmd";
    if (this.css_class) {
        css_class += " " + this.css_class;
    }
    if (!this.visible) {
        css_class += " hidden";
    }
    if (this.primary) {
        css_class += " btn_primary";
    }
    return css_class;
});


/**
* Create a new button object in the owning page, using the spec properties supplied
* @param Spec object whose properties will be given to the newly-created button
* @return Newly-created button object
*/
Page.buttons.override("add", function (spec) {
    var button;
    if (!spec.label) {
        this.throwError("Button label must be specified in spec: " + spec.id);
    }
    button = module.exports.clone(spec);
    Core.OrderedMap.add.call(this, button);
    return button;
});
