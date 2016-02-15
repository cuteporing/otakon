$(function(){
  var commonController = {
      changeView : function(self, dfd, container, content, param, isUpdate) {
        var view = null;
        var myDfd = this.deferred();
        var json = {};

        if (param !== undefined)
          $.extend(json, param);

        (isUpdate) ?
            view = self.view.update(container,content,json)
          : view = self.view.append(container, content, json);

        view.ready(function() {
          myDfd.resolve();
        });

        return myDfd.promise();
      }
  };

  h5.u.obj.expose('sys.controller', {
    common : commonController
  });

});