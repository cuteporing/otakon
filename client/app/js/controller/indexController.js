$(function() {
  var indexController = {

    __name: "indexController",

    __construct: function() {
      sys.common.pageMove(sys.config.DEFAULT_PAGE);
    },
  };
  h5.ui.jqm.manager.define('jqm_page_index', null, indexController);
});
