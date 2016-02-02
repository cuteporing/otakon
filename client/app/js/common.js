h5.u.obj.expose('sys.common', {

  /*
   * Function for page transition
   * @param page -- page to transfer
   */
  pageMove : function(page) {
    $('body').pagecontainer('change', page + ".html", {
      transition : 'none'
    });
  }
});