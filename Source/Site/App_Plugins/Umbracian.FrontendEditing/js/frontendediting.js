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
  
  $scope.previousPropertyAlias = null;

  $scope.goToProperty = function(propertyAlias) {
    var tab = _.find(editorState.current.tabs, function(tab) {
      return _.find(tab.properties, function(property) {
        return property.alias === propertyAlias;
      }) != null;
    });
    if(tab != null) {
      setTimeout(function () {
        // yeah, it's jQuery... 
        var tabElement = $("a[data-toggle='tab']")[editorState.current.tabs.indexOf(tab)];
        if (tabElement) {
          tabElement.click()
        }
        if($scope.previousPropertyAlias != null && $scope.previousPropertyAlias !== propertyAlias) {
          $scope.highlightProperty($scope.previousPropertyAlias, true);
        }
        $scope.previousPropertyAlias = propertyAlias;
        $scope.highlightProperty(propertyAlias, false);
      }, 200);
    }
    else {
      if($scope.previousPropertyAlias) {
        $scope.highlightProperty($scope.previousPropertyAlias, true);
        $scope.previousPropertyAlias = null;
      }
    }
  }
  
  $scope.highlightProperty = function (propertyAlias, revert) {
    var property = $("label[for='" + propertyAlias + "']").closest('.umb-property');
    if (!property) {
      return;
    }
    property[0].scrollIntoView();
    //property.effect("highlight");
  }
});
