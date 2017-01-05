"use strict";

var Section = require("./Section.js");


module.exports = Section.clone({
    id: "ItemSet",
    items: null,                // array of item objects
    item_type: null,            // ItemSet.Item or a descendant
    allow_add_items: true,
    allow_delete_items: true,
    add_item_icon: "<i class='icon-plus'></i>",         // ordinary plus ; "&#x2795;" heavy plus sign
    delete_item_icon: "<i class='icon-remove'></i>",    // ordinary cross; "&#x274C;" heavy cross mark
    add_item_label: "Add a new item",
    delete_item_label: "Remove this item",
    text_no_items: "no items",
    text_one_items: "1 item",
    text_many_items: "items",
    itemset_size: 10,
    itemset_size_ext: 20,
    itemset_size_long_lists: 1000,
    itemset: null,
    itemset_last: null,
    frst_itemset_icon: "<i class='icon-fast-backward'></i>",
    prev_itemset_icon: "<i class='icon-backward'></i>",
    next_itemset_icon: "<i class='icon-forward'></i>",
    last_itemset_icon: "<i class='icon-fast-forward'></i>",
    extd_itemset_icon: "<i class='icon-arrow-down'></i>",
});


module.exports.register("addItem");
module.exports.register("deleteItem");
module.exports.register("renderBeforeItems");
module.exports.register("renderAfterItems");


module.exports.defbind("initializeItemSet", "cloneInstance", function () {
    this.items = [];
    this.itemset = 1;
    this.itemset_last = 1;
});


module.exports.define("linkToDataSet", function (dataset) {
    var that = this;

    dataset.defbind("addItemLinkage" + this.id, "itemAdded", function (item) {
        that.addItem(item);
    });

    dataset.defbind("removeItemLinkage" + this.id, "itemRemoved", function (item) {
        that.deleteItem(item);
    });

    dataset.eachItem(function (item) {
        that.addItem(item);
    });
});


module.exports.define("addItem", function (spec) {
    var item = spec.item_type.clone({
        id: spec.id,
        owner: this,
    });
    if (!this.allow_add_items) {
        this.throwError("items cannot be added to this ItemSet");
    }
    this.items.push(item);
    this.happen("addItem", item);
    if (this.item_elmt) {
        item.render(this.item_elmt);
    }
    return item;
});


module.exports.define("deleteItem", function (item) {
    var i = this.items.indexOf(item);
    if (i < 0) {
        this.throwError("item not in this ItemSet: " + item.id);
    }
    if (!this.allow_delete_items) {
        this.throwError("items cannot be deleted from this ItemSet");
    }
    if (item.allow_delete === false) {
        this.throwError("this item cannot be deleted");
    }
    item.setDelete(true);
    this.items.splice(i, 1);
    this.happen("deleteItem", item);
    this.render();         // no object containing the tr element, so must refresh whole section
});


module.exports.define("getItemCount", function () {
    return this.items.length;
});


module.exports.define("eachItem", function (funct) {
    var i;
    for (i = 0; i < this.items.length; i += 1) {
        funct(this.items[i]);
    }
});


module.exports.override("isValid", function () {
    var valid = true;
    this.eachItem(function (item) {
        valid = valid && (item.deleting || item.isValid());
    });
    return valid;
});


module.exports.defbind("renderItemSet", "render", function () {
    var i;
    this.happen("renderBeforeItems");
    this.item_elmt = this.getItemSetElement();
    for (i = 0; i < this.items.length; i += 1) {
        this.items[i].render(this.item_elmt);
    }
    this.happen("renderAfterItems");
});


module.exports.define("getItemSetElement", function () {
    return this.getSectionElement().makeElement(this.main_tag);
});


/**
* To render elements displayed in the event that the list thas no items. By default this will
* be the text_no_items but can be overridden to display addition elements.
* @param
*/
module.exports.define("renderNoItems", function () {
    this.getSectionElement().text(this.text_no_items);
});


module.exports.define("extendItemSet", function () {
    this.itemset = 1;
    this.itemset_size += this.itemset_size_ext;
});


/**
* To render the player-style control for pages back and forth through itemsets of data, if
* appropriate
* @param foot_elem (xmlstream)
*/
module.exports.define("renderListPager", function (foot_elem) {
    var ctrl_elem = foot_elem.makeElement("span", "btn-group css_item_pager");
    if (this.itemset > 1) {
        ctrl_elem.makeElement("a", "css_cmd btn btn-mini", "list_set_frst_" + this.id)
            .attr("title", "first itemset")
            .text(this.frst_itemset_icon, true);
        ctrl_elem.makeElement("a", "css_cmd btn btn-mini", "list_set_prev_" + this.id)
            .attr("title", "previous itemset")
            .text(this.prev_itemset_icon, true);
    }
    this.renderItemCount(ctrl_elem);

//    if (this.open_ended_itemset || (this.itemset_last > 1 &&
// this.itemset < this.itemset_last)) {
    if (this.subsequent_itemset || this.itemset > 1) {
        ctrl_elem
            .makeElement("span", "css_list_itemcount")
            .makeElement("a", "css_cmd btn btn-mini", "list_set_extend_" + this.id)
            .attr("title", "expand this itemset by " + this.itemset_size_ext + " items")
            .text(this.extd_itemset_icon, true);
    }
    if (this.subsequent_itemset) {
        ctrl_elem
            .makeElement("a", "css_cmd btn btn-mini", "list_set_next_" + this.id)
            .attr("title", "next itemset")
            .text(this.next_itemset_icon, true);
    }
    if (this.subsequent_itemset && !this.open_ended_itemset) {
        ctrl_elem
            .makeElement("a", "css_cmd btn btn-mini", "list_set_last_" + this.id)
            .attr("title", "last itemset")
            .text(this.last_itemset_icon, true);
    }
});


module.exports.define("getItemCountText", function () {
    var text;
    if (this.itemset === 1 && !this.subsequent_itemset) {
        if (this.item_count === 0) {
            text = this.text_no_items;
        } else if (this.item_count === 1) {
            text = this.text_one_items;
        } else {
            text = this.item_count + " " + this.text_many_items;
        }
    } else if (this.frst_item_in_set && this.last_item_in_set) {
        text = "items " + this.frst_item_in_set + " - " + this.last_item_in_set;
        if (!this.open_ended_itemset && this.found_items &&
                this.itemset_size < this.found_items) {
            text += " of " + this.found_items;
        }
    } else {
        text = this.item_count + " " + this.text_many_items;
    }
    return text;
});


/**
* Move to the nth itemset
* @param Index of itemset to move to
*/
module.exports.define("moveToItemset", function (new_itemset) {
    return undefined;
});
