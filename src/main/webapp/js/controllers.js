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
      $q.when(Database.list('Cities'), function(cities) {
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
      // When user clicks '-' button remove affected row from array
      vm.deleteRow = function(index) {
          vm.predicateRows.splice(index, 1);
      };
      // When user clicks 'Query' button build predicates and execute query
      vm.query = function() {
          vm.results = null;
          var start = new Date().getTime();
          // Acquire handle on database
          $q.when(Database.getConnection(), function(db) {
        	  // Track aggregate predicate(s) that preceded the predicate currently being built. This allows 'chaining' of predicates
        	  // to construct complex queries.
              var previousPredicate = null;
              // Get Cities table from database
              var Cities = db.getSchema().table('Cities');
              // For each predicate row the user entered...
              vm.predicateRows.forEach(function(row){
                  var predicate = null;
                  // Find the field the user selected
                  var field = Cities[row.field.column];
                  // Default the queried value if appropriate
                  if (row.value === undefined || row.value == null) {
                      row.value = '';
                  }
                  // Pick an appropriate predicate function based on selected operator
                  switch (row.operator) {
	                  case '=':
	                      predicate = field.eq(row.value);
	                      break;
	                  case '<':
	                      predicate = field.lt(row.value);
	                      break;
	                  case '<=':
	                      predicate = field.lte(row.value);
	                      break;
	                  case '>':
	                      predicate = field.gt(row.value);
	                      break;
	                  case '>=':
	                      predicate = field.gte(row.value);
	                      break;
	                  case 'MATCHES':
	                      predicate = field.match(row.value);
	                      break;
	                  case 'IS NULL':
	                      predicate = field.isNull(row.value);
	                      break;
                  }
                  // If user selected the negation checkbox, negate the predicate
                  if (row.not) {
                      predicate = lf.op.not(predicate);
                  }
                  // If this isn't the first predicate being built attempt to associate this predicate with the previous
                  // by building a compound predicate using a grouping function
                  if (row.grouping && previousPredicate != null) {
                      previousPredicate = row.grouping.groupingFunction(previousPredicate, predicate);
                  } else {
                	  // This was the first predicate being built, store a handle to it in case there are more.
                      previousPredicate = predicate;
                  }
              });
              // We now have our aggregate predicates with which we can query. Kick off a select query
              $q.when(db.select().from(Cities).where(previousPredicate).exec(), function(queryResults){
            	  // Query is complete, add results to grid.
                  vm.gridOptions['data'] = queryResults;
                  vm.elapsed = new Date().getTime() - start;
              });
          });
      };
    }])
  .controller('ComparisonController', ['$q', 'Database',
    function($q, Database) {
      var vm = this;
      vm.search = {};

      // Execute when user clicks 'Find by Primary Key' button
      vm.findByPrimaryKey = function() {
    	  // Pick a primary key halfway through the dataset to search for
          var primaryKey = 2500;
          var jsStart = new Date().getTime();
          // Get all Cities from the database
          $q.when(Database.list('Cities'), function(cities) {
              vm.findResults = {};
              // Search for primary key using standard JS iteration, stop once match is found.
              for (var i = 0; i < cities.length; i++) {
                  if (cities[i].id === primaryKey) {
                      break;
                  }
              }
              // Make note of elapsed time and store into scope
              var elapsed = new Date().getTime() - jsStart;
              vm.findResults['js'] = {'elapsed': elapsed};
          }).then(function() {
        	  // Now that we've finished the JS version of searching try the Lovefield version
              var lfStart = new Date().getTime();
              // Get database connection
              return $q.when(Database.getConnection(), function(db) {
                  var Cities = db.getSchema().table('Cities');
                  // Construct custom query to search for city by ID
                  return db.select().from(Cities).where(Cities.id.eq(primaryKey)).exec();
              }).then(function(queryResult) {
            	  // Result found, make note of elapsed time and store into scope
                  var elapsed = new Date().getTime() - lfStart;
                  vm.findResults['lf'] = {'elapsed': elapsed};
              }, function(error) {
                  console.log('Error:' + error);
              });
          });
      };
      // Execute when user clicks 'Sort by Population' button
      vm.sortByPopulationAsc = function() {
          var jsStart = new Date().getTime();
          // Pull all cities from the database
          $q.when(Database.list('Cities'), function(cities) {
              vm.sortResults = {};
              // Use JS Array.sort() with custom compare function
              cities.sort(function(a, b){
                  return b.population - a.population;
              });
              // Mark elapsed time and store into scope
              var elapsed = new Date().getTime() - jsStart;
              vm.sortResults['js'] = {'elapsed': elapsed};
          }).then(function() {
              var lfStart = new Date().getTime();
              // Get database connection
              return $q.when(Database.getConnection(), function(db) {
                  var Cities = db.getSchema().table('Cities');
                  // Construct custom query to sort cities
                  return db.select().from(Cities).orderBy(Cities.population, lf.Order.ASC).exec();
              }).then(function(queryResult) {
            	  // Mark elapsed time and store into scope
                  var elapsed = new Date().getTime() - lfStart;
                  vm.sortResults['lf'] = {'elapsed': elapsed};
              }, function(error) {
                  console.log('Error:' + error);
              });
          });
      };
      // Click when user selects 'Complex Query' button
      vm.complexSearch = function() {
          var jsStart = new Date().getTime();
          // Pull all Cities from database
          $q.when(Database.list('Cities'), function(cities) {
              vm.complexResults = {};
              var matches = [];
              // Iterate across all cities
              cities.forEach(function(city) {
            	  // If city doesn't match any search criteria then skip
                  if ( (vm.search.city && vm.search.city !== '' && !city.name.contains(vm.search.city)) ||
                          (vm.search.state && vm.search.state !== '' && !city.state.contains(vm.search.state)) || 
                          (!isNaN(vm.search.popGt) && city.population < vm.search.popGt) ||
                          (!isNaN(vm.search.popLt) && city.population > vm.search.popLt) ) {
                      return;
                  }
                  // City matches, add to results
                  matches.push(city);
              });
              // Mark elapsed time and store into scope
              var elapsed = new Date().getTime() - jsStart;
              vm.complexResults['js'] = { 'results': matches.length, 'elapsed': elapsed};
          }).then(function(){
              var lfStart = new Date().getTime();
              // Acquire database connection
              return $q.when(Database.getConnection(), function(db) {
                  var Cities = db.getSchema().table('Cities');
                  var predicates = [];
                  // For each search criteria that was populate construct a Predicate
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
                      return db.select().from(Cities).where(andPredicate).exec();
                  } else {
                	  // User didn't enter any criteria, just query all cities
                      return db.select().from(Cities).exec();
                  }
              }).then(function(queryResult){
            	  // Mark elapsed time, store into scope
                  var elapsed = new Date().getTime() - lfStart;
                  vm.complexResults['lf'] = { 'results': queryResult.length, 'elapsed': elapsed};
              }, function(error){
                  console.log('Error:' + error);
              });
          });
      };
  }]);
