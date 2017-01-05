/*global x, _ */
"use strict";


/**
* To support a streamed out of XML character data
*/
module.exports = Parent.clone({
    id                      : "XmlStream",
    state                   : null,         // 0 = not yet opened, 1 = opened, not yet closed, 2 = closed
    indent                  : null,
    line_separator          : "",
     left_bracket_subst     : "≤",       // for XML substitution
    right_bracket_subst     : "≥"        // for XML substitution
});


module.exports. left_bracket_regex  = new RegExp(module.exports. left_bracket_subst, "g");
module.exports.right_bracket_regex  = new RegExp(module.exports.right_bracket_subst, "g");
module.exports. left_bracket_escape = new RegExp("<", "g");
module.exports.right_bracket_escape = new RegExp(">", "g");

/**
* To inizialize the XmlStream object
*/
module.exports.override("clone", function (spec) {
    var obj = Parent.clone.call(this, spec);
    obj.name  = obj.name || obj.id;
    obj.resetRoot();
    return obj;
});


module.exports.define("resetRoot", function () {
    this.attrs      = {};        // Don't want to inherit parent properties
    this.state      = 0;
    this.curr_child = null;
    if (this.out === undefined) {
        this.out = { collector: "" };
    }
});


module.exports.define("reset", function () {
    if (this.level > 0) {
        Log.error("tried to call reset() on level > 0 element");
        this.throwError("must only be called on top-level element");
    }
    this.resetRoot();
    if (typeof this.out.collector === "string") {
        this.out.collector = "";
    }
});


/**
* Print the input string in the collector, appending if the out is a string or calling the print function if the out is a java PrintStream
* @param String
*/
module.exports.define("print", function (str) {
    if (typeof this.out.collector === "string") {       // do it this way to avoid making this.out primitives at each level
        this.out.collector += str;
    } else {
        this.out.print(str);
    }
});


module.exports.define("solo", function (obj, funct_id, render_opts) {
    if (typeof this.out.collector !== "string") {
        this.throwError("XmlStream should be cloned without 'out' stream property to use solo()");
    }
    funct_id = funct_id || "render";
    this.reset();
    obj[funct_id](this, render_opts);
    this.close();
    return this.out.collector;
});


module.exports.define("checkInvalidState", function (invalid_state) {
    if (this.state === invalid_state) {
        this.throwError("xmlstream invalid state: " + invalid_state);
    }
});


/**
* To add a new child into the xml structure
* @param String name of the child, String id attr of the child, String css_class attr of the child, String text to add as child content
* @return x.XmlStream latest added child
*/
module.exports.define("addChild", function (name, id, css_class, text) {
    this.checkInvalidState(2);          // check not closed
    if (this.state === 0) {
        this.open();
        this.print(">");
    }
    if (this.curr_child) {
        this.curr_child.close();
    }
    this.curr_child = this.clone({ id: name, parent: this, name: name, level: this.level + 1});
    if (id) {
        this.curr_child.attr("id", id);
    }
    if (css_class) {
        this.curr_child.attr("class", css_class);
    }
    if (text) {
        this.curr_child.text(text);
    }
    return this.curr_child;
});


/**
* To initialize the root node of the XmlStream
*/
module.exports.define("open", function () {
    var str = ""\;
    this.checkInvalidState(1);          // check not already open
    this.checkInvalidState(2);          // check not closed
    if (!this.name) {
        this.throwError("name property required");
    }
    str += this.getIndentAndSeparator();
    str += "<" + this.name;
    _.each(this.attrs, function (attr_val, attr_id) {
        str += " " + attr_id + "=\"" + attr_val + "\"";
    });
    this.print(str);
    this.state = 1;
});


/**
* To close the XmlStream loping through all the open childs
*/
module.exports.define("close", function () {
    var str = "";
    this.checkInvalidState(2);          // check not already closed
    if (this.state === 1) {
        if (this.curr_child) {
            this.curr_child.close();
            str += this.getIndentAndSeparator();
        }
        str += "</" + this.name + ">";
    } else {
        this.open();
        str += "/>";
    }
    this.print(str);
    this.state = 2;
});


/**
* To get the indent String used to indent the XmlStream
* @return String
*/
module.exports.define("getIndentAndSeparator", function () {
    var str = this.line_separator,
        i;

    if (typeof this.indent === "number" && this.level > 0) {
        for (i = 0; i < (this.indent * this.level); i += 1) {
            str += " ";
        }
    }
    return str;
});



/**
* Escape an input string to skip the jsoup clean
* @param string
* @return String
*/
module.exports.define("escape", function (str) {
    if (typeof str !== "string") {
        this.throwError("arg must be a string");
    }
    return str.replace(this. left_bracket_escape, this. left_bracket_subst)
              .replace(this.right_bracket_escape, this.right_bracket_subst);
});


/*TODO
build an XmlStream object from a parsed document
module.exports.define("parse", function (xml_string) {
    var Parser = Packages.org.jsoup.parser.Parser,
        Jsoup  = Packages.org.jsoup.Jsoup;

    return JSoup.parse(xml_string, "", Parser.xmlParser());
});
*/




// jQuery mirror functions...

/**
* To add an attribute into the last added child.
* @param String attribute to add into the last child, String value of the attribute, Boolean valid_xml_content to enable the value escaping
* @return x.XmlStream object
*/
module.exports.define("attr", function (attr_name, attr_value) {
    this.checkInvalidState(1);          // check not already open
    this.checkInvalidState(2);          // check not closed
    if (typeof attr_name !== "string") {
        this.throwError("attr must be a string: " + attr_name);
    }
    if (typeof attr_value !== "string") {
        this.throwError("value must be a string: " + attr_value);
    }
// use underscope instead of JSoup?
//    this.attrs[attr_name] = Under.escape(attr_value);
    this.attrs[attr_name] = JSoup.escape(attr_value, this.JSoup_output_settings);
    return this;                // allow cascade
});


module.exports.define("data", function (data_name, obj) {
    return this.attr("data-" + data_name, JSON.stringify(obj));
});


module.exports.define("empty", function () {
    return;
});


/**
* To add text string as content of the latest added child. It cleans the text from potentially dangerous html tags
* @param String name of the child, String id attr of the child, String css_class attr of the child, String text to add as child content
* @return XmlStream child where we are adding the text
*/
module.exports.define("text", function (text, valid_xml_content) {
    this.checkInvalidState(2);          // check not closed
    if (typeof text !== "string") {
        this.throwError("invalid argument");
    }
    if (this.state === 0) {
        this.open();
        this.print(">");
    }
    if (this.curr_child) {
        this.curr_child.close();
        this.curr_child = null;
    }

    // apply whitelist to outgoing values
    text = JSoup.escape(text, this.JSoup_output_settings);

    text = text.replace(this.left_bracket_regex , (!valid_xml_content ? "&lt;" : "<"))
               .replace(this.right_bracket_regex, (!valid_xml_content ? "&gt;" : ">"));

    this.print(text);
    return this;                // allow cascade
});


// deprecated method name
module.exports.define("addText", function (text, valid_xml_content) {
    return this.text(text, valid_xml_content);                // allow cascade
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
    var elmt;
    elmt = this.addChild(name, id, css_class);
    if (css_class) {
        elmt.attr("class", css_class);
    }
    if (id) {
        elmt.attr("id"   , id);
    }
    return elmt;
});


module.exports.define("makeAnchor", function (label, href, css_class, id, hover_text, target) {
    var elmt = this.makeElement("a", css_class, id);
    if (href) {
        elmt.attr("href"  , href);
    }
    if (target) {
        elmt.attr("target", target);
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
    elmt.attr("type" , "radio");
    elmt.attr("name" , control);
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
    elmt.attr("type" , "checkbox");
    elmt.attr("name" , control);
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
        .attr("rel"  , "tooltip")
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
