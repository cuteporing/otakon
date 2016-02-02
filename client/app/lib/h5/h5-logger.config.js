$(document).bind("h5preinit", function() {
  h5.settings.log = {
    out: [{
      category: '*',
      level: "LOG_LEVEL",
      targets: "console",
      enableStackTrace : true
    }]
  };
});
