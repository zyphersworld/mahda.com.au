/* router.js — generic hash router (#/id). Same pattern as the other
   mahda.com.au subfolder sites. */
(function (global) {
  "use strict";

  function Router(opts) {
    this.routes = {};
    this.fallback = opts && opts.fallback ? opts.fallback : null;
    this.onChange = opts && opts.onChange ? opts.onChange : function () {};
    this._bound = this._handle.bind(this);
  }

  Router.prototype.add = function (id, handler) {
    this.routes[id] = handler;
    return this;
  };

  Router.prototype.current = function () {
    var h = (global.location.hash || "").replace(/^#\/?/, "").trim();
    return h || this.fallback;
  };

  Router.prototype._handle = function () {
    var id = this.current();
    if (!this.routes[id] && this.fallback) id = this.fallback;
    var fn = this.routes[id];
    if (typeof fn === "function") fn(id);
    this.onChange(id);
  };

  Router.prototype.start = function () {
    global.addEventListener("hashchange", this._bound);
    this._handle();
    return this;
  };

  Router.prototype.go = function (id) {
    if (this.current() === id) { this._handle(); return; }
    global.location.hash = "#/" + id;
  };

  global.Router = Router;
})(window);
