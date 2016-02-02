$(function() {
  var dashboardController = $.extend({},
      sys.controller.common, {
    __name : "dashboardController",
    __page : "dashboard",
    __templates : [],

    __postInit: function() {},

    __ready: function() {
      $('body').addClass("bg");
    }
  });

  h5.ui.jqm.manager.define('dashboard', null, dashboardController);
});