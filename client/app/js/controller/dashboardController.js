$(function() {
  var dashboardController = $.extend({},
      sys.controller.common, {
    __name : "dashboardController",
    __page : "dashboard",
    __templates : ["js/view/header.ejs"],

    __postInit: function() {
      var dfd, prom1, prom2, promWhen;
      dfd = this.deferred();
      prom1 = this.changeView(this, dfd, '#nav', 'nav', {}, true);
      prom2 = this.changeView(this, dfd, '#sub-nav1', 'sub-nav1', {}, true);
      promWhen = h5.async.when(prom1, prom2);
      promWhen.done(function() {
        dfd.resolve();
      });
      return dfd.promise();
    },

    __ready: function() {
    }
  });

  h5.ui.jqm.manager.define('dashboard', null, dashboardController);
});