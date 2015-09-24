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
      vm.gridOptions = {
              'columnDefs': [{name:'city', field:'name'}, {name:'state'}, {name:'population'}]
      };
      var database = Database.getConnection();
      var infoPromise = Database.info();
      $q.when(Database.list('Cities'), function(cities) {
          vm.gridOptions['data'] = cities;
      });
  }])
  .controller('TryController', ['$q', 'Database',
    function($q, Database) {
      var vm = this;
      vm.gridOptions = {
              'columnDefs': [{name:'city', field:'name'}, {name:'state'}, {name:'population'}]
      };
      vm.predicateRows = [];
      vm.groupings = [{name: 'AND', groupingFunction: lf.op.and},
                      {name: 'OR', groupingFunction: lf.op.or}];
      vm.fields = [{name:'City', column:'name', type:'text', valueRequired:false, operators: ['=', 'MATCHES', 'IS NULL']}, 
                   {name:'State', column:'state', type:'text', valueRequired:false, operators: ['=', 'MATCHES', 'IS NULL']}, 
                   {name:'Population', column:'population', type:'number', valueRequired:true, operators: ['=', '<', '<=', '>', '>=', 'IS NULL']}];
      vm.addRow = function() {
          vm.predicateRows.push({});
      };
      vm.deleteRow = function(index) {
          vm.predicateRows.splice(index, 1);
      };
      vm.query = function() {
          vm.results = null;
          var start = new Date().getTime();
          $q.when(Database.getConnection(), function(db) {
              var previousPredicate = null;
              var Cities = db.getSchema().table('Cities');
              vm.predicateRows.forEach(function(row){
                  var predicate = null;
                  var field = Cities[row.field.column];
                  if (row.value === undefined || row.value == null) {
                      row.value = '';
                  }

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
                  if (row.not) {
                      predicate = lf.op.not(predicate);
                  }
                  if (row.grouping && previousPredicate != null) {
                      previousPredicate = row.grouping.groupingFunction(previousPredicate, predicate);
                  } else {
                      previousPredicate = predicate;
                  }
              });

              $q.when(db.select().from(Cities).where(previousPredicate).exec(), function(queryResults){
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

      vm.findByPrimaryKey = function() {
          var primaryKey = 2500;
          var jsStart = new Date().getTime();
          $q.when(Database.list('Cities'), function(cities) {
              vm.findResults = {};
              for (var i = 0; i < cities.length; i++) {
                  if (cities[i].id === primaryKey) {
                      break;
                  }
              }

              var elapsed = new Date().getTime() - jsStart;
              vm.findResults['js'] = {'elapsed': elapsed};
          }).then(function() {
              var lfStart = new Date().getTime();
              return $q.when(Database.getConnection(), function(db) {
                  var Cities = db.getSchema().table('Cities');
                  return db.select().from(Cities).where(Cities.id.eq(primaryKey)).exec();
              }).then(function(queryResult) {
                  var elapsed = new Date().getTime() - lfStart;
                  vm.findResults['lf'] = {'elapsed': elapsed};
              }, function(error) {
                  console.log('Error:' + error);
              });
          });
      };

      vm.sortByPopulationAsc = function() {
          var jsStart = new Date().getTime();
          $q.when(Database.list('Cities'), function(cities) {
              vm.sortResults = {};
              cities.sort(function(a, b){
                  return b.population - a.population;
              });
              var elapsed = new Date().getTime() - jsStart;
              vm.sortResults['js'] = {'elapsed': elapsed};
          }).then(function() {
              var lfStart = new Date().getTime();
              return $q.when(Database.getConnection(), function(db) {
                  var Cities = db.getSchema().table('Cities');
                  return db.select().from(Cities).orderBy(Cities.population, lf.Order.ASC).exec();
              }).then(function(queryResult) {
                  var elapsed = new Date().getTime() - lfStart;
                  vm.sortResults['lf'] = {'elapsed': elapsed};
              }, function(error) {
                  console.log('Error:' + error);
              });
          });
      };

      vm.complexSearch = function() {
          var jsStart = new Date().getTime();
          $q.when(Database.list('Cities'), function(cities) {
              vm.complexResults = {};
              var matches = [];
              cities.forEach(function(city) {
                  if ( (vm.search.city && vm.search.city !== '' && !city.name.contains(vm.search.city)) ||
                          (vm.search.state && vm.search.state !== '' && !city.state.contains(vm.search.state)) || 
                          (!isNaN(vm.search.popGt) && city.population < vm.search.popGt) ||
                          (!isNaN(vm.search.popLt) && city.population > vm.search.popLt) ) {
                      return;
                  }
                  matches.push(city);
              });
              var elapsed = new Date().getTime() - jsStart;
              vm.complexResults['js'] = { 'results': matches.length, 'elapsed': elapsed};
          }).then(function(){
              var lfStart = new Date().getTime();
              return $q.when(Database.getConnection(), function(db) {
                  var Cities = db.getSchema().table('Cities');
                  var predicates = [];

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
                  if (predicates.length > 0) {
                      var andPredicate = lf.op.and.apply(null, predicates);
                      return db.select().from(Cities).where(andPredicate).exec();
                  } else {
                      return db.select().from(Cities).exec();
                  }
              }).then(function(queryResult){
                  var elapsed = new Date().getTime() - lfStart;
                  vm.complexResults['lf'] = { 'results': queryResult.length, 'elapsed': elapsed};
              }, function(error){
                  console.log('Error:' + error);
              });
          });
      };
  }]);
