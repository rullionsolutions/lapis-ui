



//-------------------------------------------------------------------------------- Row Selection and Bulk Actions
x.ui.sections.List.define("addBulkAction", function (id, button_label, target_page) {
    if (!this.bulk_actions) {
        this.bulk_actions = {};
    }
    if (this.bulk_actions[id]) {
        this.throwError("bulk action id already used: " + id);
    }
    this.bulk_actions[id] = {
        id: id,
        button_label: button_label,
        target_page: target_page,
        visible: true
    };
    if (typeof this.multirow_selection !== "boolean") {
        this.multirow_selection = true;
    }
    if (this.multirow_selection && !this.selection_col) {
        this.addSelectionColumn();
    }
});

/*
x.ui.sections.List.define("isRowSelected", function (key) {
    Log.trace("isRowSelected() is " + key + " in array " + this.selected_keys);
    return (typeof key === "string" && this.selected_keys && this.selected_keys.indexOf(key) > -1);
});


x.ui.sections.List.define("setRowSelected", function (key, bool) {
    this.selected_keys = this.selected_keys || [];
    if (!this.isRowSelected(key) && bool) {
        this.selected_keys.push(key);
    } else if (!bool) {
        this.selected_keys.splice(this.selected_keys.indexOf(key), 1);
    }
});


x.ui.sections.List.define("clearRowSelections", function () {
    Log.debug("clearRowSelections");
    this.selected_keys = [];
});
*/

x.ui.sections.List.define("addSelectionColumn", function () {
    this.selection_col = this.columns.add({
        id: "_row_selection",
        dynamic_only: true,
        sortable: false,
        sticky: true,
        label: ""
    });
    this.columns.moveTo("_row_selection", 0);

    /*Override Start*/
    this.selection_col.renderHeader = function (row_elmt) {
        var elmt = row_elmt.makeElement("th", "css_mr_sel");
        elmt.makeElement("span", "icon icon-ok");
    };
    this.selection_col.renderCell = function renderCell(row_elem, i, row_obj) {
        var td = row_elem.makeElement("td", "css_mr_sel");
        td.makeElement("span", "icon icon-ok");
    };
    /*Override End*/
    this.selection_col.visible = true;
});



/*
x.ui.sections.List.defbind("updateRowSelection", "update", function (params) {
    if (this.selection_col && typeof params["list_" + this.id + "_mr_selected"] === "string") {
        if (params["list_" + this.id + "_mr_selected"]) {
            this.selected_keys = JSON.parse(params["list_" + this.id + "_mr_selected"].replace(/&quot;/gm, '"'));
        } else {
            this.selected_keys = [];
        }
    }
});
*/



x.ui.sections.List.define("renderBulk", function (foot_elem) {
    var cell_elem,
        that = this;

    cell_elem = foot_elem.makeElement("tr", "css_mr_actions").makeElement("td");
    cell_elem.attr("colspan", String(this.getActualColumns()));
    cell_elem.makeHidden("list_" + this.id + "_mr_selected", JSON.stringify(this.selected_keys || []));
    // cell_elem.makeElement("input")
    //     .attr("name" , "list_" + this.id + "_mr_selected")
    //     .attr("type" , "hidden")
    //     .attr("value", JSON.stringify(this.selected_keys || []));

    Lib.forOwn(this.bulk_actions, function (key, value) {
        if (value.visible && Page.getPage(value.target_page)) {
            cell_elem.makeAnchor(value.button_label,
                "modal?page_id=" + value.target_page + "&page_key=" + that.owner.page.page_key /*+ that.getReferURLParams()*/,
                "btn btn-mini css_bulk disabled");

            // cell_elem.makeElement("a", "btn btn-mini css_bulk css_open_in_modal disabled")
            //     .attr("href", "?page_id=" + value.target_page + "&page_key=" + that.owner.page.page_key + that.getReferURLParams())
            //     .text(value.button_label, true);
        }
    });
    return cell_elem;
});
