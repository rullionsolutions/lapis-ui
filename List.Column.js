"use strict";

var Core = require("lapis-core");

/**
* To represent a column in a table
*/
module.exports = Core.Base.clone({
    id: "List.Column",
    visible: true,
    hover_text_icon: "&#x24D8;",
});

/**
* To indicate whether or not this column is visible (as a column, i.e. not a separate row),
* evaluated as:
* @param makeElement
* @return true if this column is a visible column, otherwise false
*/
module.exports.define("isVisibleColumn", function () {
    var column_paging = true;
    if (this.owner.section.max_visible_columns && !this.sticky) {
        column_paging = this.non_sticky_col_seq >= (this.owner.section.current_column_page *
                                                    this.owner.section.non_sticky_cols_per_page) &&
                        this.non_sticky_col_seq < ((this.owner.section.current_column_page + 1) *
                                                    this.owner.section.non_sticky_cols_per_page);
    }
    return column_paging && this.isVisibleDisregardingColumnPaging();
});


module.exports.define("isVisibleDisregardingColumnPaging", function () {
    return this.visible && !this.separate_row
            && !(this.dynamic_only && this.owner.section.isDynamic())
            && (typeof this.level_break !== "number");
});


/**
* To update running totals for this column, resetting totals if level is broken
* @param level broken (integer), 1 being the highest
*/
module.exports.define("updateAggregations", function (level_broken) {
    var i;
    for (i = 0; i < this.total.length; i += 1) {
        if (i >= level_broken) {
            this.total[i] = 0;
        }
        if (this.field) {
            if (this.field.getComputed && typeof this.field.getComputed === "function") {
                this.total[i] += parseFloat(this.field.getComputed(), 10);
            } else {
                this.total[i] += this.field.getNumber(0);
            }
        } else {
            this.total[i] += parseFloat(this.text, 10);
        }
    }
});


/**
* Generate HTML output for this column's heading, as a th element
* @param parent xmlstream element object, expected to be a tr, makeElement
*/
module.exports.define("renderHeader", function (row_elmt) {
    var elmt;
//        elmt_a,
    var css_class = this.css_class;

    if (this.field) {
        css_class += " " + this.field.getCellCSSClass();
    }
    if (this.freeze) {
        css_class += " css_col_freeze";
    }
    if (this.field && typeof this.field.renderListHeader === "function") {
        this.field.renderListHeader(row_elmt, css_class);
        return;
    }
    elmt = row_elmt.makeElement("th", css_class);
    if (this.width) {
        elmt.attr("style", "width: " + this.width);
    }
    if (this.min_width) {
        elmt.attr("style", "min-width: " + this.min_width);
    }
    if (this.max_width) {
        elmt.attr("style", "max-width: " + this.max_width);
    }
    if (this.description && this.owner.section.isDynamic()) {
        elmt.makeTooltip(this.hover_text_icon, this.description);
        elmt.text("&nbsp;", true);
    }
    if (this.owner.section.list_advanced_mode && this.owner.section.sortable
            && this.sortable !== false
            && this.owner.section.isDynamic() && this.query_column) {
        elmt = this.renderSortLink(elmt);
    }
    elmt.text(this.label);
});


/**
* To render the heading content of a sortable column as an anchor with label text, which when
* clicked brings
* @param th element (xmlstream) to put content into, label text string
* @return anchor element (xmlstream)
*/
module.exports.define("renderSortLink", function (elem) {
    var sort_seq_asc = 0;
    var sort_seq_desc = 0;
    var anchor_elem;
    var span_elem;
    var description;

    if (typeof this.query_column.sort_seq === "number" && this.query_column.sort_seq < 3) {
        if (this.query_column.sort_desc) {
            sort_seq_desc = this.query_column.sort_seq + 1;
        } else {
            sort_seq_asc = this.query_column.sort_seq + 1;
        }
    }
    anchor_elem = elem.makeElement("a", "css_cmd css_list_sort");
    if (sort_seq_asc === 1 || sort_seq_desc > 1) {
        description = "Sort descending at top level";
        anchor_elem.attr("id", "list_sort_desc_" + this.owner.section.id + "_" + this.id);
    } else {
        description = "Sort ascending at top level";
        anchor_elem.attr("id", "list_sort_asc_" + this.owner.section.id + "_" + this.id);
    }
    anchor_elem.attr("title", description);

    if (sort_seq_asc > 0) {
        span_elem = anchor_elem.makeElement("span", "css_uni_icon");
        span_elem.attr("style", "opacity: " + (0.3 * (4 - sort_seq_asc)).toFixed(1));
        span_elem.text(this.owner.section.sort_arrow_asc_icon, true);
    }
    if (sort_seq_desc > 0) {
        span_elem = anchor_elem.makeElement("span", "css_uni_icon");
        span_elem.attr("style", "opacity: " + (0.3 * (4 - sort_seq_desc)).toFixed(1));
        span_elem.text(this.owner.section.sort_arrow_desc_icon, true);
    }
    return anchor_elem;
});


/**
* To render the sort controls of a sortable column as two arrows, one up and one down, which when
* clicked
* @param th element (xmlstream) to put content into
module.exports.define("renderSortIcons", function (elem) {
    var sort_seq_asc  = 0,
        sort_seq_desc = 0;

    if (typeof this.query_column.sort_seq === "number" && this.query_column.sort_seq < 3) {
        if (this.query_column.sort_desc) {
            sort_seq_desc = this.query_column.sort_seq + 1;
        } else {
            sort_seq_asc  = this.query_column.sort_seq + 1;
        }
    }
    elem.makeElement("a")
        .attr("title", "Sort Ascending")
        .makeElement("img", "list_sort_asc_"  + this.owner.section.id + "_" + this.id, "css_cmd")
        .attr("alt", "Sort Ascending")
        .attr("src", "../cdn/icons/ico_sort_" + sort_seq_asc  + "_asc.png");
    elem.makeElement("a")
        .attr("title", "Sort Descending")
        .makeElement("img", "list_sort_desc_" + this.owner.section.id + "_" + this.id, "css_cmd")
        .attr("alt", "Sort Descending")
        .attr("src", "../cdn/icons/ico_sort_" + sort_seq_desc + "_desc.png");
});
*/


/**
* Generate HTML output for this column's cell in a table body row
* @param parent xmlstream element object for the row, render_opts, column index number, generic
* object representing the row (e.g. a x.sql.Query or x.Entity object)
* @return xmlstream element object for the cell, a td
*/
module.exports.define("renderCell", function (row_elem, i, row_obj) {
    var field = this.field;
    var cell_elem;

    if (field) {
        field = row_obj.getField(field.id) || field;
        cell_elem = field.renderCell(row_elem);
    } else {
        cell_elem = row_elem.makeElement("td", this.css_class);
        if (this.text) {
            cell_elem.text(this.text);
        }
    }
    return cell_elem;
});


/**
* Generate HTML output for this column's cell in a table body row
* @param table_elem: parent xmlstream element object, render_opts, i: column index number,
* row_obj: row object
* @return xmlstream element object for the cell, a td
*/
module.exports.define("renderAdditionalRow", function (table_elem, row_obj, css_class) {
    var row_elem;
    var cell_elem;
    var css_type;

    if (this.visible && this.separate_row
            && ((this.field && (this.field.getText() || this.field.isEditable()))
                || (!this.field && this.text))) {
        row_elem = table_elem.makeElement("tr", css_class);
        this.owner.section.rowURL(row_elem, row_obj);
        if (this.owner.section.allow_delete_rows) {
            row_elem.makeElement("td", "css_col_control");
        }
        row_elem.makeElement("td", "css_align_right")
            .makeTooltip(this.hover_text_icon, this.label, "css_uni_icon");
            // .makeElement("a", null, "css_uni_icon")
            // .attr("rel"  , "tooltip")
            // .attr("title", this.label)
            // .text(this.hover_text_icon, true);
//        row_elem.makeElement("td", null, "css_list_additional_row_label", this.label + ":");
        css_type = (this.css_type || (this.field && this.field.css_type));
        cell_elem = row_elem.makeElement("td");
        if (css_type) {
            cell_elem.attr("class", "css_type_" + css_type);
        }
        cell_elem.attr("colspan", (this.owner.section.getActualColumns() - 1).toFixed(0));

        // cell_elem.makeElement("i", null, null, );
        // cell_elem.text(":");
        if (this.field) {
            this.field.renderFormGroup(cell_elem, "table-cell");
        } else if (this.text) {
            cell_elem.text(this.text);
        }
    }
    return cell_elem;
});


/**
* Generate HTML output for this column's cell in a total row
* @param parent xmlstream element object for the row, render_opts
* @return xmlstream element object for the cell, a td
*/
module.exports.define("renderAggregation", function (row_elem, level, rows) {
    var cell_elem;
    var css_class = this.css_class;
    var number_val;

    if (this.visible && !this.separate_row) {
        if (this.field) {
            css_class += " " + this.field.getCellCSSClass();
        }
        if (this.freeze) {
            css_class += " css_col_freeze";
        }
        cell_elem = row_elem.makeElement("td", css_class);
        cell_elem.attr("id", this.id);
        number_val = null;
        if (this.aggregation === "C") {
            number_val = rows;
        } else if (this.aggregation === "S") {
            number_val = this.total[level];
        } else if (this.aggregation === "A") {
            number_val = (this.total[level] / rows);
        }
        if (typeof number_val === "number") {
            if (isNaN(number_val)) {
                cell_elem.text("n/a");
            } else if (this.field && typeof this.field.format === "function") {
                cell_elem.text(this.field.format(number_val));
            } else {
                cell_elem.text(number_val.toFixed(this.decimal_digits || 0));
            }
        }
    }
    return cell_elem;
});
