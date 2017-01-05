"use strict";

var Core = require("lapis-core");

/**
* To represent an HTML Element
*/
module.exports = Core.Base.clone({
    id: "Element",
    jquery_elem: null,
});


module.exports.define("attr", function (attr, value, valid_xml_content) {
    if (typeof attr !== "string") {
        throw new Error("attr must be a string: " + attr);
    }
    if (typeof value !== "string") {
        throw new Error("value must be a string: " + value);
    }
    if (!valid_xml_content) {
        value = value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
    this.jquery_elem.attr(attr, value);
    return this;                // allow cascade
});


module.exports.define("text", function (text, valid_xml_content) {
    if (typeof text !== "string") {
        this.throwError("text must be a string: " + text);
    }
    // if (!valid_xml_content) {
    //     text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    // }
    text = text.replace(this.left_bracket_regex, "<").replace(this.right_bracket_regex, ">");
    if (valid_xml_content) {
        this.jquery_elem.html(text);
    } else {
        this.jquery_elem.text(text);
    }
    return this;                // allow cascade
});


module.exports.define("empty", function () {
    this.jquery_elem.empty();
});


module.exports.define("bindClick", function (object, target_funct, data_obj) {
    this.jquery_elem.click(function (event) {
        object[target_funct || "click"](event, data_obj);
    });
});


// functions equivalent to jquery extension functions

/*
to be added to jquery...
module.exports.define("makeElement", function (tag, css_class, id) {
    var elmt;
    this.append("<" + tag + "/>");
    elmt = this.children(tag).last();
    if (css_class) {
        elmt.attr("class", css_class);
    }
    if (id) {
        elmt.attr("id"   , id);
    }
    return elmt;
});
*/

module.exports.define("makeElement", function (name, css_class, id) {
    this.curr_child = this.clone({
        id: name,
        parent: this,
        name: name,
        level: this.level + 1,
    });
    this.jquery_elem.append("<" + name + ">");
    this.curr_child.jquery_elem = this.jquery_elem.children().last();
    if (id) {
        this.curr_child.attr("id", id);
    }
    if (css_class) {
        this.curr_child.attr("class", css_class);
    }
    return this.curr_child;
});


module.exports.define("makeAnchor", function (label, href, css_class, id, hover_text, target) {
    var elmt = this.makeElement("a", css_class, id);
    if (href) {
        elmt.attr("href", href);
    }
    if (target) {
        elmt.attr("target", target);
    }
    if (hover_text) {
        elmt.attr("title", hover_text);
    }
    if (label) {
        elmt.text(label);
    }
    return elmt;
});


// won't work like this client-side - can't set type after input element created
module.exports.define("makeInput", function (type, id, value, css_class, placeholder) {
    var elmt = this.makeElement("input", css_class, id);
    elmt.attr("type", type);
    if (value) {
        elmt.attr("value", value);
    }
    if (placeholder) {
        elmt.attr("placeholder", placeholder);
    }
    return elmt;
});


module.exports.define("makeOption", function (id, label, selected, css_class) {
    var elmt = this.makeElement("option", css_class, id);
    elmt.attr("value", id);
    if (selected) {
        elmt.attr("selected", "selected");
    }
    elmt.text(label);
    return elmt;
});


module.exports.define("makeHidden", function (id, value, css_class) {
    var elmt = this.makeElement("input", css_class, id);
    elmt.attr("type", "hidden");
    if (value) {
        elmt.attr("value", value);
    }
    return elmt;
});


module.exports.define("makeRadio", function (control, id, selected, css_class) {
    var elmt = this.makeElement("input", css_class, control + "." + id);
    elmt.attr("type", "radio");
    elmt.attr("name", control);
    elmt.attr("value", id);
    if (selected) {
        elmt.attr("checked", "checked");
    }
    return elmt;
});


module.exports.define("makeRadioLabelSpan", function (control, id, label, selected) {
    var span_elmt = this.makeElement("span", "css_attr_item", control);
    span_elmt.makeRadio(control, id, selected);
    span_elmt.makeElement("label")
        .attr("for", control + "." + id)
        .text(label);
    return span_elmt;
});


module.exports.define("makeCheckbox", function (control, id, checked, css_class) {
    var elmt = this.makeElement("input", css_class, control + "." + id);
    elmt.attr("type", "checkbox");
    elmt.attr("name", control);
    elmt.attr("value", id);
    if (checked) {
        elmt.attr("checked", "checked");
    }
    return elmt;
});


module.exports.define("makeCheckboxLabelSpan", function (control, id, label, checked) {
    var span_elmt = this.makeElement("span", "css_attr_item", control);
    span_elmt.makeCheckbox(control, id, checked);
    span_elmt.makeElement("label")
        .attr("for", control + "." + id)
        .text(label);
    return span_elmt;
});


module.exports.define("makeUniIcon", function (icon, href, id) {
    var elmt = this.makeElement("a", "css_uni_icon", id);
    if (href) {
        elmt.attr("href", href);
    }
    elmt.html(icon);
    return elmt;
});


module.exports.define("makeTooltip", function (label, text, css_class) {
    var elmt = this.makeElement("a", css_class)
        .attr("rel", "tooltip")
        .attr("title", text);

    if (label) {
        elmt.text(label, true);
    }
    return elmt;
});


module.exports.define("makeLabel", function (label, for_id, css_class, tooltip) {
    var elmt = this.makeElement("label", css_class);
    if (for_id) {
        elmt.attr("for", for_id);
    }
    if (tooltip) {
        elmt.makeElement("a")
            .attr("rel", "tooltip")
            .attr("title", tooltip)
            .text(label);
    } else {
        elmt.text(label);
    }
    return elmt;
});


module.exports.define("makeDropdownUL", function (control, right_align) {
    var ul_elmt = this.makeElement("ul", "dropdown-menu" + (right_align ? " pull-right" : ""))
        .attr("role", "menu")
        .attr("aria-labelledby", control);
    return ul_elmt;
});


module.exports.define("makeDropdownButton", function (control, label, url, tooltip, css_class, right_align) {
    var elmt = this.makeElement("button", (css_class || "") + " dropdown-toggle btn", control);
    elmt.attr("type", "button");
    elmt.attr("role", "button");
    elmt.attr("data-toggle", "dropdown");
    elmt.attr("aria-haspopup", "true");
//    elmt.attr("data-target", "#");
    if (tooltip) {
        elmt.attr("title", tooltip);
    }
    if (url) {
        elmt.attr("href", url);
    }
    elmt.makeDropdownLabel(label, right_align);
    return elmt;
});


module.exports.define("makeDropdownIcon", function (control, label, url, tooltip, css_class, right_align) {
    var elmt = this.makeElement("a", (css_class || "") + " dropdown-toggle", control);
    elmt.attr("data-toggle", "dropdown");
    elmt.attr("aria-haspopup", "true");
    if (tooltip) {
        elmt.attr("title", tooltip);
    }
    if (url) {
        elmt.attr("href", url);
    }
    elmt.makeDropdownLabel(label, right_align);
//    elmt.text(" " + icon, true);
    return elmt;
});


module.exports.define("makeDropdownLabel", function (label, right_align) {
    if (right_align) {
        this.text((label || "") + "&nbsp;", true);
        this.makeElement("b", "caret");
    } else {
        this.makeElement("b", "caret");
        this.text("&nbsp;" + (label || ""), true);
    }
});

