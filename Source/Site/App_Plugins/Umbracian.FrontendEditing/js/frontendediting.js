angular.module("umbraco").controller("Umbracian.FrontendEditing.Controller", function ($scope, assetsService, editorState, contentResource, $routeParams) {
  if($routeParams.ufe == true) {
    assetsService.loadCss("/App_Plugins/Umbracian.FrontendEditing/css/frontendediting.css").then(function () {
      parent.ufeLoadComplete();
    });
  }

  $scope.$on("formSubmitted", function (ev, args) {
    if ($routeParams.ufe == true) {
      // need to do some sleeping here to ensure that the route params are updated (editorState doesn't seem to work)
      // TODO: some better handling of this at some point
      setTimeout(function () {
        contentResource.getNiceUrl($routeParams.id).then(function (url) {
          parent.ufeEditComplete(url);
        });
      }, 200);
    }
  });
});
