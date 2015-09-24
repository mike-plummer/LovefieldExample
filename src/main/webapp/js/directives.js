'use strict';

/* Directives */

angular.module('directives', [])
  .directive('predicateRow', [
    function(){
        return {
            restrict: 'E',
            templateUrl: 'partials/predicateRow.html'
        }
    }
  ]);