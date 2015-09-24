'use strict';

/* Services */

angular.module('services', ['ngResource'])
  .factory('CityService', ['$resource',
    function($resource){
        return $resource('cities', null, {
            list: {method:'GET', isArray: true, cache: true}
        });
    }
  ]);
