"use strict";

var Core = require("lapis-core");
var ItemSet = require("./ItemSet.js");

/**
* The root Archetype of a list or grid section
*/
module.exports = ItemSet.clone({
    id: "List",
    columns: Core.OrderedMap.clone({ id: "List.columns", }),
    allow_choose_cols: true,
    show_header: true,
    show_footer: true,
    right_align_numbers: true,
    hide_table_if_empty: true,
//    text_total_row: "Total"
    sort_arrow_asc_icon: "&#x25B2;",
    sort_arrow_desc_icon: "&#x25BC;",
});


/**
* Initialise the columns collection in this section object
*/
module.exports.defbind("cloneList", "cloneInstance", function () {
    this.columns = this.parent.columns.clone({
        id: "List.columns",
        section: this,
    });
});


/**
* Set 'list_advanced_mode' property from session property, and 'record_select_col' if
* 'record_select' is given
*/
// module.exports.defbind("setAdvancedMode", "setup", function () {
    // this.list_advanced_mode = (this.owner.page.session.list_advanced_mode === true);
// });


/**
* To reset record_count property and call resetAggregations(), initializeColumnPaging(), etc
*/
module.exports.defbind("renderBeforeRecords", "render", function () {
    this.resetAggregations();
    this.table_elem = null;
    if (!this.hide_table_if_empty) {
        this.getTableElement();
    }
});


/**
* To return the 'table_elem' XmlStream object for the HTML table, creating it if it doesn't
* already exist
* @param
* @return table_elem XmlStream object for the HTML table
*/
module.exports.define("getTableElement", function () {
    var css_class;

    if (!this.table_elem) {
        css_class = "css_list table table-bordered table-condensed table-hover form-inline";
        if (this.selected_keys && this.selected_keys.length > 0) {
            css_class += " css_mr_selecting";
        }
        if (this.right_align_numbers) {
            css_class += " css_right_align_numbers";
        }
        // this.table_elem = this.getSectionElement().makeElement("div", "css_scroll")
        // .makeElement("table", css_class, this.id);
        this.table_elem = this.getSectionElement().makeElement("table", css_class, this.id);

        if (this.show_header) {
            this.renderHeader(this.table_elem);
        }
    }
    return this.table_elem;
});


/**
* To return the number of actual shown HTML columns, being 'total_visible_columns' +
* 'level_break_depth', ONLY available after renderHeader() is called
* @return number of actual shown HTML columns
*/
module.exports.define("getActualColumns", function () {
    return (this.total_visible_columns || 0) + (this.level_break_depth || 0);
});


/**
* To generate the HTML thead element and its content, calling renderHeader() on each visible column
* @param xmlstream table element object,
* @return row_elem xmlstream object representing the th row
*/
module.exports.define("renderHeader", function (table_elem) {
    var thead_elem;
    var row_elem;
    var total_visible_columns = 0;

    thead_elem = table_elem.makeElement("thead");
    if (this.show_col_groups) {
        this.renderColumnGroupHeadings(thead_elem);
    }

    row_elem = this.renderHeaderRow(thead_elem);
    this.columns.each(function (col) {
        if (col.isVisibleColumn()) {
            col.renderHeader(row_elem);
            total_visible_columns += 1;
        }
    });
    this.total_visible_columns = total_visible_columns;
    return row_elem;
});


module.exports.define("renderHeaderRow", function (thead_elem) {
    var row_elem = thead_elem.makeElement("tr");
    var i;

    for (i = 0; i < this.level_break_depth; i += 1) {
        row_elem.makeElement("th", "css_level_break_header");
    }
    return row_elem;
});


module.exports.define("renderColumnGroupHeadings", function (thead_elem) {
    var row_elem = this.renderHeaderRow(thead_elem);
    var group_label = "";
    var colspan = 0;

    function outputColGroup() {
        var th_elem;
        if (colspan > 0) {
            th_elem = row_elem.makeElement("th", "css_col_group_header");
            th_elem.attr("colspan", String(colspan));
            th_elem.text(group_label);
        }
    }
    this.columns.each(function (col) {
        if (col.isVisibleColumn()) {
            if (typeof col.group_label === "string" && col.group_label !== group_label) {
                outputColGroup();
                group_label = col.group_label;
                colspan = 0;
            }
            colspan += 1;
        }
    });
    outputColGroup();
});


module.exports.override("getItemSetElement", function () {
    return this.getTableElement().makeElement("tbody");
});


module.exports.define("getColumnVisibility", function () {
    var columns = "";
    var col_separator = "";

    if (this.list_advanced_mode && this.allow_choose_cols) {
        this.columns.each(function (col) {
            if (col.visible) {
                columns += col_separator + col.id;
                col_separator = "|";
            }
        });
        columns = "&cols_filter_" + this.id + "_list=" + columns;
    }
    return columns;
});


module.exports.define("setColumnVisibility", function (params) {
    var columns;
    if (this.list_advanced_mode && this.allow_choose_cols) {
        if (Object.hasOwnProperty.call(params, "cols_filter_" + this.id + "_list")) {
            columns = params["cols_filter_" + this.id + "_list"].split("|");
            this.columns.each(function (col) {
                col.visible = columns.indexOf(col.id) > -1;
            });
        }
    }
});


module.exports.defbind("renderAfterRecords", "render", function () {
    if (this.element) {
        if (!this.table_elem && this.getRecordCount() === 0) {
//            this.sctn_elem.text(this.text_no_records);
            this.renderNoRecords();
        } else if (this.table_elem && (this.show_footer || this.bulk_actions)) {
            this.renderFooter(this.table_elem);
        }
    }
});


/**
* To return a string URL for the row, if appropriate
* @param row_elem (xmlstream), record (usually a fieldset)
* @return string URL or null or undefined
*/
module.exports.define("addRecordKey", function () {
    if (this.fieldset && typeof this.fieldset.getKey === "function") {
        this.element.attr("data-key", this.fieldset.getKey());
    }
});


/**
* To render the table footer, as a containing div, calling renderRowAdder(), render the
* column-chooser icon,
* @param sctn_elem (xmlstream),
* @return foot_elem (xmlstream) if dynamic
*/
module.exports.define("renderFooter", function (table_elem) {
    var foot_elem;
    var cell_elem;

//    foot_elem = sctn_elem.makeElement("div", "css_list_footer");
    if (this.bulk_actions && Object.keys(this.bulk_actions).length > 0) {
        foot_elem = table_elem.makeElement("tfoot");
        this.renderBulk(foot_elem);
    }
    if (this.show_footer) {
        if (!foot_elem) {
            foot_elem = table_elem.makeElement("tfoot");
        }
        cell_elem = foot_elem.makeElement("tr").makeElement("td");
        cell_elem.attr("colspan", String(this.getActualColumns()));
        if (this.isDynamic()) {
            this.renderRecordAdder(cell_elem);
            this.renderListPager(cell_elem);
            // this.renderColumnPager(cell_elem);
            if (this.list_advanced_mode && this.allow_choose_cols) {
                this.renderColumnChooser(cell_elem);
            }
        } else {
            this.renderRecordCount(cell_elem);
        }
    }
    return foot_elem;
});


/**
* To render the control for adding records (either a 'plus' type button or a drop-down of keys)
* if appropriate
* @param foot_elem (xmlstream), render_opts
*/
module.exports.define("renderRecordAdder", function (foot_elem) {
    return undefined;
});

/**
* To render a simple span showing the number of records, and the sub-set shown, if appropriate
* @param foot_elem (xmlstream), render_opts
*/
module.exports.define("renderRecordCount", function (foot_elem) {
    return foot_elem.makeElement("span", "css_list_recordcount").text(this.getRecordCountText());
});


module.exports.define("outputNavLinks", function (page_key, details_elmt) {
    var index;
    this.trace("outputNavLinks() with page_key: " + page_key + " keys: " + this.keys + ", " + this.keys.length);
    if (this.keys && this.keys.length > 0) {
        this.debug("outputNavLinks() with page_key: " + page_key + " gives index: " + index);
        if (this.prev_recordset_last_key === page_key && this.recordset > 1) {
            this.moveToRecordset(this.recordset - 1);            // prev recordset
        } else if (this.next_recordset_frst_key === page_key && this.subsequent_recordset) {
            this.moveToRecordset(this.recordset + 1);            // next recordset
        }
        index = this.keys.indexOf(page_key);
        if (index > 0) {
            details_elmt.attr("data-prev-key", this.keys[index - 1]);
            // obj.nav_prev_key = this.keys[index - 1];
        } else if (index === 0 && this.prev_recordset_last_key) {
            details_elmt.attr("data-prev-key", this.prev_recordset_last_key);
            // obj.nav_prev_key = this.prev_recordset_last_key;
        }
        if (index < this.keys.length - 1) {
            details_elmt.attr("data-next-key", this.keys[index + 1]);
            // obj.nav_next_key = this.keys[index + 1];
        } else if (index === this.keys.length - 1 && this.next_recordset_frst_key) {
            details_elmt.attr("data-next-key", this.next_recordset_frst_key);
            // obj.nav_next_key = this.next_recordset_frst_key;
        }
    }
});


/**
* Reset column aggregation counters
*/
module.exports.define("resetAggregations", function () {
    var text_total_record = "";
    var delim = "";

    function updateTextTotalRow(col_aggregation, aggr_id, aggr_label) {
        if (col_aggregation === aggr_id && text_total_record.indexOf(aggr_label) === -1) {
            text_total_record += delim + aggr_label;
            delim = " / ";
        }
    }
    this.columns.each(function (col) {
        col.total = [0];
        if (col.aggregation && col.aggregation !== "N") {
            updateTextTotalRow(col.aggregation, "S", "totals");
            updateTextTotalRow(col.aggregation, "A", "averages");
            updateTextTotalRow(col.aggregation, "C", "counts");
        }
    });
    if (!this.text_total_record) {
        this.text_total_record = text_total_record;
    }
});


/**
* Update column aggregation counters with this record's values
* @param Record obj representing current record
*/
module.exports.define("updateAggregations", function () {
    this.columns.each(function (col) {
        var i;
        if (col.field) {
            for (i = 0; i < col.total.length; i += 1) {
                col.total[i] += col.field.getNumber(0);
            }
        }
    });
});


/**
* Show a total row at bottom of table if any visible column is set to aggregate
* @param xmlstream element object for the table, render_opts
*/
module.exports.define("renderAggregations", function () {
    var first_aggr_col = -1;
    var pre_aggr_colspan = 0;
    var row_elem;
    var i;
    var col;

    for (i = 0; i < this.columns.length(); i += 1) {
        col = this.columns.get(i);
        if (col.isVisibleColumn()) {
            if (col.aggregation && col.aggregation !== "N") {
                first_aggr_col = i;
                break;
            }
            pre_aggr_colspan += 1;
        }
    }
    if (first_aggr_col === -1) {        // no aggregation
        return;
    }
    row_elem = this.getTableElement().makeElement("tr", "css_record_total");
    if (pre_aggr_colspan > 0) {
        row_elem.makeElement("td").attr("colspan", pre_aggr_colspan.toFixed(0)).text(this.text_total_record);
    }
    for (i = first_aggr_col; i < this.columns.length(); i += 1) {
        this.columns.get(i).renderAggregation(row_elem, 0, this.getRecordCount());
    }
});


/**
* Create a new column object, using the spec properties supplied
* @param Spec object whose properties will be given to the newly-created column
* @return Newly-created column object
*/
module.exports.columns.override("add", function (col_spec) {
    var column;
    if (col_spec.field) {
        if (col_spec.field.accessible === false) {
            return null;
        }
        col_spec.id = col_spec.id || col_spec.field.id;
        col_spec.label = col_spec.label || col_spec.field.label;
        col_spec.css_class = col_spec.css_class || "";
        col_spec.width = col_spec.width || col_spec.field.col_width;
        col_spec.min_width = col_spec.min_width || col_spec.field.min_col_width;
        col_spec.max_width = col_spec.max_width || col_spec.field.max_col_width;
        col_spec.description = col_spec.description || col_spec.field.description;
        col_spec.aggregation = col_spec.aggregation || col_spec.field.aggregation;
        col_spec.separate_row = col_spec.separate_row || col_spec.field.separate_row;
        col_spec.decimal_digits = col_spec.decimal_digits || col_spec.field.decimal_digits || 0;
        col_spec.sortable = col_spec.sortable || col_spec.field.sortable;
        col_spec.tb_input = col_spec.tb_input || col_spec.field.tb_input_list;
        col_spec.group_label = col_spec.group_label || col_spec.field.col_group_label;

        if (typeof col_spec.visible !== "boolean") {
            col_spec.visible = col_spec.field.list_column;
        }
        col_spec.field.visible = true;              // show field content is column is visible
    }
    if (typeof col_spec.label !== "string") {
        this.throwError("label not specified");
    }
    if (col_spec.group_label && typeof this.section.show_col_groups !== "boolean") {
        this.section.show_col_groups = true;
    }
//    column = module.exports.Column.clone(col_spec);
// Allows section specific column overrides to have an affect
    column = module.exports.Column.clone(col_spec);
    Core.OrderedMap.add.call(this, column);
    return column;
});

