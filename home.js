"use strict";

var Page = require("./Page.js");


module.exports = Page.clone({
    id: "home",
    title: "Home",
    security: { all: true, },
});


module.exports.defbind("setupEnd", "setupEnd", function () {
    // var that = this;
    this.setTitle("Welcome, " /* + this.session.nice_name*/);
});

