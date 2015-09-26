'use strict';

/* Services */

angular.module('services', ['ngResource'])
  .factory('CityService', ['$resource',
    function($resource){
        return $resource('cities', null, {
            list: {method:'GET', isArray: true}
        });
    }
  ])
  .factory('JSCityService', ['$q', 'CityService',
    function($q, CityService){
    	return {
    		// Retrieve Cities from service and sort using custom JS
    		// Returns a promise
    		sortByPopulationAsc: function() {
    			var result = $q.defer();
    	        CityService.list(null, function(cities) {
		            // Use JS Array.sort() with custom compare function
		            cities.sort(function(a, b){
		                return b.population - a.population;
		            });
		            return result.resolve(cities);
    	        }, function(error){ result.reject(error); });
    	        return result.promise;
    		},
    		// Retrieve Cities from service and search for matching primary key
    		// Returns a promise
    		findByPrimaryKey: function(primaryKey) {
    			var result = $q.defer();
    			CityService.list(null, function(cities) {
	    			for (var i = 0; i < cities.length; i++) {
	                    if (cities[i].id === primaryKey) {
	                        result.resolve(cities[i]);
	                    }
	                }
	                result.resolve(null);	// Not found
    			}, function(error){ result.reject(error); });
    			return result.promise;
    		},
    		// Retrieve Cities from service and search using supplied search values
    		// Returns a promise
    		complexSearch: function(search) {
    			var result = $q.defer();
    			CityService.list(null, function(cities) {
    				var matches = [];
	                // Iterate across all cities
	                cities.forEach(function(city) {
	              	  	// If city doesn't match any search criteria then skip
	                    if ( (search.city && search.city !== '' && city.name.indexOf(search.city) < 0) ||
	                         (search.state && search.state !== '' && city.state.indexOf(search.state) < 0) || 
	                         (!isNaN(search.popGt) && city.population < search.popGt) ||
	                         (!isNaN(search.popLt) && city.population > search.popLt) ) {
	                        return;
	                    }
	                    // City matches, add to results
	                    matches.push(city);
	                });
	                result.resolve(matches);
    			}, function(error){ result.reject(error); });
    			return result.promise;
    		}
    	};
    }
  ]);
