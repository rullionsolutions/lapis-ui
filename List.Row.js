"use strict";

var Item = require("./ItemSet.Item.js");

/**
* To represent a column in a table
*/
module.exports = Item.clone({
    id: "List.Row",
    main_tag: "tr",
});


module.exports.defbind("renderRow", "render", function () {
    var i;
    this.element.attr("class", this.getCSSClass());
    this.addRecordKey();
    for (i = 0; i < this.level_break_depth; i += 1) {
        this.element.makeElement("td");
    }
    for (i = 0; i < this.owner.columns.length(); i += 1) {
        if (this.owner.columns.get(i).isVisibleColumn()) {
            this.owner.columns.get(i).renderCell(this.element, i, this.fieldset);
        }
    }
    // for (i = 0; i < this.columns.length(); i += 1) {
    //     this.columns.get(i).renderAdditionalRow(table_elem, i, record, css_class);
    // }
});


/**
* To return the CSS class string for the tr object - 'css_row_even' or 'css_row_odd' for row
* striping
* @param record
* @return CSS class string
*/
module.exports.define("getCSSClass", function (record) {
    var str = (this.owner.getRecordCount() % 2 === 0) ? "css_row_even" : "css_row_odd";
    return str;
});
