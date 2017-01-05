"use strict";

var Core = require("lapis-core");

/**
* To represent a column in a table
*/
module.exports = Core.Base.clone({
    id: "ItemSet.Item",
    visible: true,
    fieldset: null,
    element: null,
    main_tag: "div",
});


module.exports.register("render");


module.exports.define("render", function (parent_elmt) {
    if (!this.element) {
        this.element = parent_elmt.makeElement(this.main_tag, "hidden", this.id);
    }
    this.element.empty();
    if (!this.fieldset.deleting) {
        this.happen("render");
    }
});
