/* ============================================================
   EKKLESIA 2027 — Hash router
   Routes are of the form #/id. Same pattern as mahda.com.au:
   listen for hashchange, resolve to a known page id, fall back
   to a default when the hash is empty or unrecognised.
   ============================================================ */

(function (global) {
  "use strict";

  function Router(validIds, defaultId, onRoute) {
    this.validIds = validIds;
    this.defaultId = defaultId;
    this.onRoute = onRoute;
    this._bind();
  }

  Router.prototype._resolve = function () {
    var raw = global.location.hash || "";
    var id = raw.replace(/^#\/?/, "").split("?")[0].split("/")[0].trim();
    if (!id || this.validIds.indexOf(id) === -1) {
      id = this.defaultId;
    }
    return id;
  };

  Router.prototype._bind = function () {
    var self = this;
    var fire = function () {
      var id = self._resolve();
      self.onRoute(id);
    };
    global.addEventListener("hashchange", fire);
    global.addEventListener("DOMContentLoaded", fire);
    // In case DOMContentLoaded already fired before this script's
    // caller attaches, also fire on next tick.
    setTimeout(fire, 0);
  };

  Router.prototype.go = function (id) {
    global.location.hash = "#/" + id;
  };

  global.EkklesiaRouter = Router;
})(window);
