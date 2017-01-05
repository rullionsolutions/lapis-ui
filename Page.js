"use strict";

var Core = require("lapis-core");
var Element = require("./Element.js");
var Under = require("underscore");
var jQuery = require("jquery");


var pages = {};

/**
* Unit of system interaction, through the User Interface or a Machine Interface
*/
module.exports = Core.Base.clone({
    id: "Page",
    skin: "index.html",
    prompt_message: null,
    tab_sequence: false,
    tab_forward_only: false,
    tabs: Core.OrderedMap.clone({ id: "Page.tabs", }),
    sections: Core.OrderedMap.clone({ id: "Page.sections", }),
    links: Core.OrderedMap.clone({ id: "Page.links", }),
    buttons: Core.OrderedMap.clone({ id: "Page.buttons", }),
});


module.exports.register("allowed");
module.exports.register("setupStart");
module.exports.register("setupEnd");
module.exports.register("presave");
module.exports.register("success");
module.exports.register("failure");
module.exports.register("cancel");
module.exports.register("render");


module.exports.defbind("clonePage", "clone", function () {
    this.tabs = this.parent.tabs.clone({
        id: this.id + ".tabs",
        page: this,
        instance: this.instance,
    });
    this.sections = this.parent.sections.clone({
        id: this.id + ".sections",
        page: this,
        instance: this.instance,
    });
    this.links = this.parent.links.clone({
        id: this.id + ".links",
        page: this,
        instance: this.instance,
    });
    this.buttons = this.parent.buttons.clone({
        id: this.id + ".buttons",
        page: this,
        instance: this.instance,
    });
});


module.exports.defbind("cloneType", "cloneType", function () {
    if (pages[this.id]) {
        this.throwError("page already registered with this id: " + this.id);
    }
    pages[this.id] = this;
});


module.exports.defbind("cloneInstance", "cloneInstance", function () {
    var that = this;
    var visible_tabs;
    if (!this.selectors) {
        this.throwError("no 'selectors' object provided");
    }
    this.active = true;
    this.elements = {};
    Under.each(this.selectors, function (selector, id) {
        that.elements[id] = Element.clone({
            id: id,
            jquery_elem: jQuery(selector),
        });
        if (that.elements[id].jquery_elem.length !== 1) {
            that.throwError("invalid selector: " + id + ", found " + that.elements[id].jquery_elem.length + " times");
        }
    });
    this.happen("setupStart");
    this.sections.each(function (section) {
        section.happen("setup");
    });
    visible_tabs = this.getVisibleTabs();
    if (visible_tabs.first) {
        this.moveToTab(visible_tabs.first);
    }
    this.happen("setupEnd");
    this.setTitle(this.title);
    this.setDescription(this.descr);
});


module.exports.define("getPage", function (page_id) {
    return pages[page_id];
});


module.exports.define("getPageThrowIfNotFound", function (page_id) {
    var page = this.getPage(page_id);
    if (!page) {
        this.throwError("no page found with id: " + page_id);
    }
    return page;
});


/**
* Initialise the buttons and outcomes of a Page
*/
module.exports.defbind("setupButtons", "setupStart", function () {
    if (this.tab_sequence) {
        this.buttons.add({
            id: "prev_tab",
            label: "Previous",
            page_funct_click: "moveToPreviousVisibleTab",
        });
        this.buttons.add({
            id: "next_tab",
            label: "Next",
            primary: true,
            page_funct_click: "moveToNextVisibleTab",
        });
    }
});


/**
* To determine whether or not the given session has permission to access this page with the given
* key, according to the following logic:
* @param session (object); page key (string) mandatory if page requires a key; cached_record
* (object) optional, only for checkRecordSecurity()
* @return 'allowed' object, with properties: access (boolean), page_id, page_key, text (for user),
* reason (more technical)
*/
module.exports.define("allowed", function (session, page_key, cached_record) {
    var allowed = {
        access: false,
        page_id: this.id,
        user_id: session.user_id,
        page_key: page_key,
        reason: "no security rule found",
        toString: function () {
            return this.text + " to " + this.page_id + ":" + (this.page_key || "[no key]") +
                " for " + this.user_id + " because " + this.reason;
        },
    };
    this.happen("allowed", {
        allowed: allowed,
        session: session,
        page_key: page_key,
        cached_record: cached_record,
    });

    if (!allowed.text) {
        allowed.text = "access " + (allowed.access ? "granted" : "denied");
    }
    return allowed;
});


/**
* To obtain the page security result for this user from the given page object
* @param session (object), allowed object
*/
module.exports.defbind("checkBasicSecurity", "allowed", function (spec) {
    var area = this.getArea();
    if (!spec.session) {
        return;
    }
    if (this.security) {
        spec.session.checkSecurityLevel(this.security, spec.allowed, "page");
    }
    if (!spec.allowed.found && this.entity && this.entity.security) {
        spec.session.checkSecurityLevel(this.entity.security, spec.allowed, "entity");
    }
    if (!spec.allowed.found && area && area.security) {
        spec.session.checkSecurityLevel(area.security, spec.allowed, "area");
    }
});


module.exports.define("moveToTab", function (new_tab_ref) {
    var visible_tabs = this.getVisibleTabs(this.current_tab);
    var new_tab;
    var new_tab_ix;
    if (typeof new_tab_ref === "string") {
        new_tab = this.tabs.get(new_tab_ref);
        if (!new_tab) {
            this.throwError("tab not found: " + new_tab_ref);
        }
    } else {
        if (this.tabs.indexOf(new_tab_ref) === -1) {
            this.throwError("invalid tab: " + new_tab_ref);
        }
        new_tab = new_tab_ref;
    }
    if (!new_tab.visible) {
        this.throwError("can't move to invisible tab: " + new_tab_ref);
    }
    new_tab_ix = this.tabs.indexOf(new_tab);
    if (this.tab_forward_only && (new_tab_ix < this.tabs.indexOf(this.current_tab))) {
        this.throwError("can't move backwards: " + new_tab_ref);
    }
    this.current_tab = new_tab;

    if (this.tab_sequence) {
        this.buttons.get("prev_tab").visible = (new_tab_ix > this.tabs.indexOf(visible_tabs.first)) && !this.tab_forward_only;
        this.buttons.get("next_tab").visible = (new_tab_ix < this.tabs.indexOf(visible_tabs.last));
        this.buttons.each(function (button) {
            if (button.show_only_on_last_visible_tab === true) {
                button.visible = (new_tab === visible_tabs.last);
            }
        });
    }
});


module.exports.define("getVisibleTabs", function (curr_tab) {
    var curr_tab_visible = false;
    var out = {};
    this.tabs.each(function (tab) {
        if (tab.visible) {
            out.last = tab;
            if (curr_tab_visible && !out.next) {
                out.next = tab;
            }
            if (tab === curr_tab) {
                curr_tab_visible = true;
            }
            if (!out.first) {
                out.first = tab;
            }
            if (!curr_tab_visible && curr_tab) {
                out.previous = tab;
            }
        }
    });
    this.trace("getVisibleTabs(): first " + out.first + ", last " + out.last +
        ", prev " + out.previous + ", next " + out.next + ", curr " + curr_tab);
    return out;
});


module.exports.define("moveToNextVisibleTab", function () {
    var next_visible_tab = this.getVisibleTabs(this.current_tab).next;
    if (!next_visible_tab) {
        this.throwError("no next visible tab found");
    }
    this.moveToTab(next_visible_tab);
    this.render();
});


module.exports.define("moveToPreviousVisibleTab", function () {
    var prev_visible_tab = this.getVisibleTabs(this.current_tab).previous;
    if (!prev_visible_tab) {
        this.throwError("no previous visible tab found");
    }
    this.moveToTab(prev_visible_tab);
    this.render();
});


module.exports.define("moveToFirstErrorTab", function () {
    var that = this;
    var first_error_tab;
    this.sections.each(function (section) {
        var tab = section.tab && that.tabs.get(section.tab);
        if (tab && tab.visible && !first_error_tab && !section.isValid()) {
            first_error_tab = tab;
        }
    });

    if (!first_error_tab) {
        this.throwError("no first error tab found");
    }
    this.moveToTab(first_error_tab);
    this.render();
});


/**
* Cancel this page and redirect to previous one; throws Error if page is already not active
*/
module.exports.define("cancel", function () {
    if (this.active !== true) {
        this.throwError("subsequent call to cancel()");
    }
    this.happen("cancel");
    this.redirect_url = (this.exit_url_cancel || this.exit_url);
    this.active = false;
});


// ---------------------------------------------------------------------------------------  render
module.exports.define("render", function () {
    this.happen("render");
});


/**
* Call render() on each section that is associated with current tab or has no tab
* @param xmlstream page-level div element object
* @return xmlstream div element object containing the section divs
*/
module.exports.defbind("renderSections", "render", function () {
    var that = this;
    var current_tab_id = (this.current_tab ? this.current_tab.id : null);
    var div_elem;
    var row_span = 0;

    if (!this.elements.content) {
        return;
    }
    this.elements.content.empty();
    this.sections.each(function (section) {
        var tab = section.tab && that.tabs.get(section.tab);
        if (section.visible && section.accessible !== false &&
                (!tab || tab.visible) &&
                (that.render_all_sections || !tab || section.tab === current_tab_id)) {
            row_span += section.tb_span;
            if (!div_elem || row_span > 12) {
                div_elem = that.elements.content.makeElement("div", "row");
                row_span = section.tb_span;
            }
            section.render(div_elem);
        }
    });
});


module.exports.defbind("renderTabs", "render", function () {
    var that = this;
    if (!this.elements.tabs || this.render_tabs === false) {
        return;
    }
    this.elements.tabs.empty();
    this.tabs.each(function (tab) {
        if (tab.visible) {
            tab.render(that.elements.tabs);
        }
    });
});


module.exports.defbind("renderButtons", "render", function () {
    var that = this;
    if (!this.elements.buttons || this.render_buttons === false) {
        return;
    }
    this.elements.buttons.empty();
    this.buttons.each(function (button) {
        if (button.visible) {
            button.render(that.elements.buttons);
        }
    });
});


module.exports.defbind("renderLinks", "render", function () {
    var that = this;
    if (!this.elements.links || this.render_links === false) {
        return;
    }
    this.elements.links.empty();
    this.links.each(function (link) {
        if (link.isVisible(that.session)) {
            link.render(that.elements.links);
        }
    });
});


/**
* Returns the minimal query string referencing this page, including its page_key if it has one
* @return Relative URL, i.e. '{skin}?page_id={page id}[&page_key={page key}]'
*/
module.exports.define("getSimpleURL", function (override_key) {
    var page_key = override_key || this.page_key;
    return this.skin + "#page_id=" + this.id + (page_key ? "&page_key=" + page_key : "");
});


/**
* Returns the page title text string
* Page title text string
*/
module.exports.define("setTitle", function (title) {
    return this.selectors.title && jQuery(this.selectors.title).text(title || "");
});


module.exports.define("setDescription", function (descr) {
    return this.selectors.descr && jQuery(this.selectors.descr).text(descr || "");
});
