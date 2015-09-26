'use strict';

/* Controllers */

angular.module('controllers', ['database'])
  .controller('SummaryController', [
    function() {
      var vm = this;
    }])
  .controller('DataController', ['$q', 'Database',
                                 function($q, Database) {
      var vm = this;
      // Setup column definitions for grid
      vm.gridOptions = {
              'columnDefs': [{name:'city', field:'name'}, {name:'state'}, {name:'population'}]
      };
      // Kick off promise for pulling all Cities from Lovefield, once resolved add to Grid.
      $q.when(Database.list(), function(cities) {
          vm.gridOptions['data'] = cities;
      });
  }])
  .controller('TryController', ['$q', 'Database',
    function($q, Database) {
      var vm = this;
      // Setup column definitions for grid
      vm.gridOptions = {
              'columnDefs': [{name:'city', field:'name'}, {name:'state'}, {name:'population'}]
      };

      // Maintain list of user-entered predicates to build custom query
      vm.predicateRows = [];

      // Allowable selections for grouping subsequent predicates with one another (AND/OR)
      vm.groupings = [{name: 'AND', groupingFunction: lf.op.and},
                      {name: 'OR', groupingFunction: lf.op.or}];

      // Allowable selections for the field a predicate can query on. Defines applicable value datatype, operators, and whether value is required
      vm.fields = [{name:'City', column:'name', type:'text', valueRequired:false, operators: ['=', 'MATCHES', 'IS NULL']},
                   {name:'State', column:'state', type:'text', valueRequired:false, operators: ['=', 'MATCHES', 'IS NULL']},
                   {name:'Population', column:'population', type:'number', valueRequired:true, operators: ['=', '<', '<=', '>', '>=', 'IS NULL']}];

      // When user clicks '+' button add new row to predicateRows
      vm.addRow = function() {
          vm.predicateRows.push({});
      };
      // When user clicks 'X' button remove selected row from array
      vm.deleteRow = function(index) {
          vm.predicateRows.splice(index, 1);
      };

      // When user clicks 'Query' button build predicates and execute query
      vm.query = function() {
          vm.results = null;
          // Store start time so we can track how long it takes to construct and perform query
          var start = new Date().getTime();
          // Acquire handle on database
          $q.when(Database.getConnection(), function(db) {
        	  // Track aggregate predicate that preceded the predicate currently being built. This allows 'chaining' of predicates
        	  // to construct complex queries.
              var aggregatePredicate = null;
              // Get Cities table from database
              var Cities = db.getSchema().table('Cities');
              // For each predicate row the user entered...
              vm.predicateRows.forEach(function(row){
            	  // Convert user's entries into a Predicate
                  var predicate = Database.constructPredicate(Cities, row.field.column, row.operator, row.value, row.not);

                  // If this isn't the first predicate being built attempt to associate this predicate with the previous
                  // by building a compound predicate using a grouping function
                  if (row.grouping && aggregatePredicate != null) {
                	  aggregatePredicate = row.grouping.groupingFunction(aggregatePredicate, predicate);
                  } else {
                	  // This was the first predicate being built, store a handle to it in case there are more.
                	  aggregatePredicate = predicate;
                  }
              });
              // We now have our aggregate predicate with which we can query. Kick off a select query
              $q.when(Database.query(aggregatePredicate), function(queryResults){
            	  // Query is complete, add results to grid.
                  vm.gridOptions['data'] = queryResults;
                  vm.elapsed = new Date().getTime() - start;
              });
          });
      };
    }])
  .controller('ComparisonController', ['$q', 'Database', 'JSCityService',
    function($q, Database, JSCityService) {
      var vm = this;
      vm.search = {};
      // Execute when user clicks 'Find by Primary Key' button
      vm.findByPrimaryKey = function() {
    	  // Pick a primary key halfway through the dataset to search for
          var primaryKey = 2500;
          vm.findResults = {};

          // Search using custom Javascript logic
          var jsStart = new Date().getTime();
          $q.when(JSCityService.findByPrimaryKey(primaryKey), function(result) {
        	  vm.findResults['js'] = {'elapsed': (new Date().getTime() - jsStart)};
          });

          // Search using Lovefield
          var lfStart = new Date().getTime();
          $q.when(Database.findByPrimaryKey(primaryKey), function(result) {
        	  vm.findResults['lf'] = {'elapsed': (new Date().getTime() - lfStart)};
          });
      };
      // Execute when user clicks 'Sort by Population' button
      vm.sortByPopulationAsc = function() {
          vm.sortResults = {};

          // Sort using Javascript
          var jsStart = new Date().getTime();
          $q.when(JSCityService.sortByPopulationAsc(), function(result) {
        	  vm.sortResults['js'] = {'elapsed': (new Date().getTime() - jsStart)};
          });

          // Sort using Lovefield
          var lfStart = new Date().getTime();
          // Get database connection
          return $q.when(Database.sortByPopulationAsc(), function(result) {
        	  vm.sortResults['lf'] = {'elapsed': (new Date().getTime() - lfStart)};
          });
      };
      // Click when user selects 'Complex Query' button
      vm.complexSearch = function() {
          vm.complexResults = {};

          // Search using Javascript
          var jsStart = new Date().getTime();
          $q.when(JSCityService.complexSearch(vm.search), function(results) {
        	  vm.complexResults['js'] = {'elapsed': (new Date().getTime() - jsStart), 'results': results.length};
          });

          // Search using Lovefield
          var lfStart = new Date().getTime();
          // Acquire database connection
          return $q.when(Database.getConnection(), function(db) {
              var Cities = db.getSchema().table('Cities');
              var predicates = [];
              // Construct a predicate for each search value that was populated
              if (vm.search.city && vm.search.city !== '') {
                  predicates.push(Cities.name.match(vm.search.city));
              }
              if (vm.search.state && vm.search.state !== '') {
                  predicates.push(Cities.state.match(vm.search.state));
              }
              if (!isNaN(vm.search.popLt)) {
                  predicates.push(Cities.population.lte(vm.search.popLt));
              }
              if (!isNaN(vm.search.popGt)) {
                  predicates.push(Cities.population.gte(vm.search.popGt));
              }
              // If user entered at least one search criteria then aggregate predicates together. Assume AND for simplicity.
              if (predicates.length > 0) {
                  var andPredicate = lf.op.and.apply(null, predicates);
                  return Database.query(andPredicate);
              } else {
            	  // User didn't enter any criteria just list all cities
                  return Database.list();
              }
          }).then(function(queryResult){
              vm.complexResults['lf'] = { 'results': queryResult.length, 'elapsed': (new Date().getTime() - lfStart)};
          }, function(error){
              console.log('Error:' + error);
          });
      };
  }]);
