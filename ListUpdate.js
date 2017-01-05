/*global x, _ */
"use strict";


x.ui.sections.ListUpdate = x.ui.sections.ListEntity.clone({
    id                      : "ListUpdate"
});


/**
* To setup this grid, by setting 'entity' to the entity specified by 'entity', then calling
*/
x.ui.sections.ListUpdate.defbind("setupAddDeleteRecords", "setup", function () {
    if (this.add_record_field) {
        this.setupAddRecordField(this.add_record_field, this.add_record_unique);
    }
    if (this.allow_delete_records) {
        this.addDeleteControlColumn();
    }
});


x.ui.sections.ListUpdate.define("addDeleteControlColumn", function () {
    var that = this,
        col  = this.columns.add({ id: "_delete", label: " " });

    col.override("renderCell", function (record_elem, ignore, record) {
        var cell_elem;
        if (this.visible) {
            cell_elem = record_elem.makeElement("td", this.css_class);
            if (record.allow_delete !== false) {      // support individual records not deletable
                cell_elem.makeElement("a", "css_cmd btn btn-mini")
                    .attr("title", that.delete_record_label)
                    .text(that.delete_record_icon, true)
                    .bindClick(that, "deleteRecordIconClicked", record);
            }
        }
    });
});


/**
* To setup this section to use an 'add record field', i.e. a field in entity (usually of Option type)
* @return the field in entity specified by 'add_record_field'
*/
x.ui.sections.ListUpdate.define("setupAddRecordField", function (add_record_field_id, add_record_unique) {
    var orig_add_record_field = this.entity.getField(add_record_field_id);
    this.add_record_unique = (typeof add_record_unique === "boolean") ? add_record_unique : this.entity.isKey(add_record_field_id);
    this.add_record_field_id  = add_record_field_id;
    this.add_record_field_obj = x.data.fields[orig_add_record_field.type].clone({
        id          : "add_record_field_" + this.id,           // Autocompleter doesn't work here yet
        label       : this.add_record_label,
        tb_input    : "input-medium",
        editable    : true,
        css_reload  : true,
        list        : orig_add_record_field.list,
        ref_entity  : orig_add_record_field.ref_entity,
        selection_filter: this.selection_filter,
        config_item : orig_add_record_field.config_item,
         label_prop : orig_add_record_field.label_prop,
        active_prop : orig_add_record_field.active_prop
    });
    this.add_record_field_obj.getOwnLoV({ skip_full_load: false });           // make sure we have full lov here..
    this.debug("setupAddRecordField(): " + this.add_record_field_obj.lov);
    this.columns.get(this.add_record_field_id).editable = false;
    return orig_add_record_field;
});


x.ui.sections.ListUpdate.define("getAddRecordItem", function (val) {
    var item;
    if (this.add_record_field_obj) {
        this.debug("getAddRecordItem(): " + val + ", from " + this.add_record_field_obj.lov);
        item = this.add_record_field_obj.lov.getItem(val);
        if (!item) {
            this.throwError("unrecognized item: " + val);
        }
        return item;
    }
});


x.ui.sections.ListUpdate.define("addExistingRecord", function (record_key) {
    var record = this.owner.page.getTrans().getActiveRecord(this.entity.id, record_key);
    this.addRecord(record);
    return record;
});


x.ui.sections.ListUpdate.define("addNewRecordIconClicked", function (field_id, field_val) {
    this.debug("addNewRecordIconClicked(): " + field_id + ", " + field_val);
    this.addNewRecord();
});


x.ui.sections.ListUpdate.define("addNewRecord", function (field_id, field_val) {
    var record;
    if (this.add_record_field_id === field_id && this.add_record_unique && !this.getAddRecordItem(field_val).active) {
        this.info("addNewRecord() record already exists: " + field_val);
        return;
    }
    record = this.addNewRecordInternal(field_id, field_val);
    return record;
});


x.ui.sections.ListUpdate.define("addNewRecordInternal", function (field_id, field_val) {
    var record = this.parent_record.createChildRecord(this.entity.id);
    // this.getParentRecord();
    if (field_id && field_val) {
        record.getField(field_id).set(field_val);
    }
    this.addRecord(record);
    return record;
});


x.ui.sections.ListUpdate.defbind("setupRecordBeingAdded", "addRecord", function (record) {
    var section = this,
        id;

    record.each(function (field) {
        field.column = section.columns.get(field.id);
        if (field.column) {
            if (field.column.tb_input) {
                field.tb_input = field.column.tb_input;
            }
            if (typeof field.column.editable  === "boolean") {
                field.editable  = field.column.editable;
            }
            if (typeof field.column.mandatory === "boolean") {
                field.mandatory = field.column.mandatory;
                field.validate();
            }
        }
    });
    if (this.add_record_unique && this.add_record_field_obj) {
        id = record.getField(this.add_record_field_id).get();
        this.debug("removing item from LoV: " + id);
        if (id) {
            this.getAddRecordItem(id).active = false;
        }
    }
});


x.ui.sections.ListUpdate.define("deleteRecordIconClicked", function (event, record) {
    this.debug("deleteRecordIconClicked()");
    this.deleteRecord(record);
});


x.ui.sections.ListUpdate.defbind("updateDueToBeDeletedRecord", "deleteRecord", function (record) {
    var id;
    if (this.add_record_unique && this.add_record_field_obj) {
        id = record.getField(this.add_record_field_id).get();
        if (id) {
            this.getAddRecordItem(id).active = true;
        }
    }
});


/*
x.ui.sections.ListUpdate.defbind("updateAddDeleteRecords", "update", function (param) {
    var match,
        record_nbr;

    if (this.allow_add_records && param.page_button === "list_add_" + this.id) {
        this.addNewRecord();

    } else if (this.allow_add_records && param.page_button === "add_record_field_" + this.id) {
        this.addNewRecord(this.add_record_field_id, param["add_record_field_" + this.id]);

    } else if (typeof param.page_button === "string") {
        match = param.page_button.match(new RegExp("list_delete_" + this.id + "_([0-9]*)"));
        if (match && match.length > 1 && this.allow_delete_records) {
            record_nbr = parseInt(match[1], 10);
            if (this.records.length <= record_nbr || !this.records[record_nbr]) {
                this.threcordError("record not found for delete");
            }
            this.deleteRecord(this.records[record_nbr]);
        }
    }
});

x.ui.sections.ListUpdate.defbind("renderBody", "renderRecords", function () {
    var i,
        j,
        col;

    if (this.allow_add_records) {
        this.getTableElement();                // force always table display
    }
//    this.resetAggregations();
    for (i = 0; i < this.records.length; i += 1) {
        if (!this.records[i].deleting) {
            this.record_count += 1;
            for (j = 0; j < this.columns.length(); j += 1) {
                col = this.columns.get(j);
                this.trace("Setting column " + col + " to have field " + this.records[i].getField(col.id));
                col.field = this.records[i].getField(col.id);
            }
            this.renderRecord(this.records[i]);
        }
    }
//    this.found_records = this.records.length;
    this.recordset_last = 1;
//    this.frst_record_in_set = 1;
//    this.last_record_in_set = this.records.length;
});
*/

x.ui.sections.ListUpdate.defbind("renderBody", "renderBeforeRecords", function () {
    if (this.allow_add_records) {
        this.getTableElement();                // force always table display
    }
});


x.ui.sections.ListUpdate.override("renderRecordAdder", function (foot_elem) {
    var ctrl_elem;
    if (this.allow_add_records) {
        ctrl_elem = foot_elem.makeElement("span", "css_list_add input-prepend css_reload");
        if (this.add_record_field_obj) {
            this.debug("renderRecordAdder(): " + this.add_record_field_obj.lov);
            ctrl_elem.makeElement("span", "add-on").addText("Add new row");
            this.add_record_field_obj.renderFormGroup(ctrl_elem, "form-inline");
        } else {
            ctrl_elem.makeElement("a", "css_cmd btn btn-mini")
                .attr("title", this.add_record_label)
                .text(this.add_record_icon, true)
                .bindClick(this, "addNewRecordIconClicked");
        }
    }
    return ctrl_elem;
});
