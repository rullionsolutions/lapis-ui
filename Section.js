"use strict";

var Core = require("lapis-core");
var Page = require("./Page.js");

/**
* To represent a component of a page with display content
*/
module.exports = Core.Base.clone({
    id: "Section",
    visible: true,
    tb_span: 12,        // replacing width
    right_align_numbers: false,
});


module.exports.register("setup");
module.exports.register("render");


module.exports.defbind("cloneCheck", "clone", function () {
    if (this.owner && this.owner.page) {
        if (this.instance !== this.owner.page.instance) {
            this.throwError("instance mismatch, this.instance = " + this.instance);
        }
    } else if (this.instance) {
        this.throwError("instance mismatch, this.instance = " + this.instance);
    }
});


/**
* Begin render logic for this page section, call this.getSectionElement() to create the other div
* for the section, unless this.hide_section_if_empty is set to suppress this; called by
* Page.renderSections() is this.visible and other tab-related logic
* @param x.XmlStream object representing the section-containing div
*/
module.exports.define("render", function (parent_elmt) {
    var temp_title;
    this.sctn_elem = null;
    if (parent_elmt) {
        this.element = parent_elmt.makeElement("div", "hidden", this.id);
    } else {
        this.element.empty();
    }
    if (!this.hide_section_if_empty) {
        this.getSectionElement();
    }
    temp_title = this.title || this.generated_title;
    if (temp_title) {
        this.element.makeElement("h2", "css_section_title").text(temp_title);
    }
    if (this.text) {
        this.element.makeElement("div", "css_section_text").text(this.text, true);    // Valid XML content
    }
    this.happen("render");
});


/**
* To output the opening elements of the section on first call - the outer div, its title and
* introductory text, and sets this.sctn_elem which is used by subsequent render logic for the
* section; can be called repeatedly to return this.sctn_elem
* @return x.XmlStream object representing the main div of the section, to which subsequent content
* should be added
*/
module.exports.define("getSectionElement", function () {
    this.element.attr("class", this.getCSSClass());
    return this.element;
});


/**
* To determine the CSS class(es) for the div element of this page, including its tb_span, and
* whether or not numbers should be right-aligned
* @return String content of the div element's CSS class attribute
*/
module.exports.define("getCSSClass", function () {
    var css_class = "col-md-" + this.tb_span;
    if (this.right_align_numbers) {
        css_class += " css_right_align_numbers";
    }
    return css_class;
});


/**
* To report whether or not this section is entirely valid, to be overridden
* @param none
* @return true (to be overridden)
*/
module.exports.define("isValid", function () {
    return true;
});


module.exports.define("isDynamic", function () {
    return (this.owner.page.dynamic !== false);
});


/**
* To return the URL parameters to include in order to reference back to this section object
* @param none
* @return String URL fragment, beginning with '&'
*/
module.exports.define("getReferURLParams", function () {
    return "&refer_page=" + this.owner.page.id + "&refer_section=" + this.id;
});


module.exports.define("deduceKey", function () {
    var key;
    var link_field;

    if (this.key) {                         // key specified directly as a property
        key = this.key;
    } else if (this.link_field) {           // via 'link_field' property
        link_field = this.owner.page.getPrimaryRow().getField(this.link_field);
        if (!link_field) {
            this.throwError("link field invalid");
        }
        key = link_field.get();
    } else if (this.owner.page.page_key_entity) {       // having same entity as page_key_entity
        if (this.entity.id === this.owner.page.page_key_entity.id && this.owner.page.page_key) {
            key = this.owner.page.page_key;
        }
    } else if (this.entity.id === this.owner.page.entity.id && this.owner.page.page_key) {
        key = this.owner.page.page_key;     // having same key as page
    }
    return key;
});


Page.sections.override("add", function (spec) {
    var section;
    if (!Core.Base.isOrIsDescendant(spec.type, module.exports)) {
        this.throwError("Section type must be Section or a descendant of it");
    }
    spec.owner = this;
    spec.instance = this.page.instance;
    section = spec.type.clone(spec);
    Page.sections.parent.add.call(this, section);
    if (spec.instance) {
        section.happen("setup");
    }
    return section;
});
