'use strict';

/* Database */

angular.module('database', ['services'])
.factory('Database', ['$q', 'CityService',
                      function($q, CityService){
    // Initialize the database schema - this includes schema declaration, tables, and columns
    // Schema declaration is performed synchronously (no promises here).
    var schemaBuilder = lf.schema.create('data', 1);
    schemaBuilder.createTable('Cities')
      .addColumn('id', lf.Type.NUMBER)
      .addColumn('name', lf.Type.STRING)
      .addColumn('state', lf.Type.STRING)
      .addColumn('population', lf.Type.NUMBER)
      .addPrimaryKey(['id'])
      .addIndex('idxPopulationAsc', ['population'], false, lf.Order.ASC);

    // Build a deferred to handle resolving the handle to the database since it may take some time for it to initialize and load data.
    var database = $q.defer();
    // Connect to the database using the schemaBuilder we constructed above. From this point onwards we cannot modify the schema.
    // The connection if only performed once during the lifecycle of the application - a handle to the returned database instance
    // is maintained in the above deferred.
    schemaBuilder.connect().then(function(db) {
        // Get the 'Cities' table
        var Cities = db.getSchema().table('Cities');
        // Hit the server for City data
        CityService.list(null, function(cities) {
            // Convert each returned City object into a City database row. Since the object's fields exactly
            // match the expected column names Lovefield handles this for us. If there is any mismatch then
            // additional mapping code is necessary in the 'createRow(..)' call.
            var cityRows = [];
            cities.forEach(function(city) {
                cityRows.push(Cities.createRow(city));
            });
            // Add all the rows we just built to the database.
            db.insertOrReplace().into(Cities).values(cityRows).exec().then(
                function() {
                    console.log('Data loaded');
                    // Assuming we succeeded in loading then go ahead and make the database available for use
                    database.resolve(db);
                },
                function(error) {
                    console.log('Error loading database:' + error);
                    database.reject(error);
                }
            );
        }, function(){ console.log('Error retrieving cities'); });
    }, function() {database.reject('Error');});

    return {
        // Returns a promise that eventually resolves to a basic object containing info about the current state
        // of the database.
        info: function() {
            var info = {
                    'size': 0
            };
            return $q.when(database.promise, function(db) {
                var Cities = db.getSchema().table('Cities');
                // Construct a query to just count the number of rows in the Cities table.
                // SELECT COUNT(id) FROM Cities;
                return db.select(lf.fn.count(Cities.id)).from(Cities).exec();
            }).then(function(queryResult) {
                // Grab the result of the count query from above and set into our Info object
                var count = queryResult[0]['COUNT(id)'];
                info['size'] += count;
                // Resolve the promise
                return info;
            });
        },
        // Returns the promise for the database deferred. Until this resolves we know the database is still initializing and
        // loading data so other functions should wait. This handle allows consumers to construct custom queries or do
        // pretty much anything else besides modify the schema.
        getConnection: function() {
            return database.promise;
        },
        // Returns a promise that will resolve to the matching City or null if not found
        findByPrimaryKey: function(primaryKey) {
            // Get database connection
            return $q.when(database.promise, function(db) {
                var Cities = db.getSchema().table('Cities');
                // Construct custom query to search for city by ID
                return db.select().from(Cities).where(Cities.id.eq(primaryKey)).exec();
            }).then(function(queryResult) {
                return queryResult;
            }, function(error) {
                console.log('Error:' + error);
            });
        },
        // Returns a promise that resolves a listing of all rows from the specified database table.
        list: function() {
            return $q.when(database.promise, function(db) {
                var table = db.getSchema().table('Cities');
                // Execute a SELECT * FROM Cities; query
                return db.select().from(table).exec();
            }).then(function(queryResult){
                // Resolve the promise
                return queryResult;
            });
        },
        // Returns a promise that resolves to a listing of all Cities ordered by ascending population
        sortByPopulationAsc: function() {
        	return $q.when(database.promise, function(db) {
                var Cities = db.getSchema().table('Cities');
                // Construct custom query to sort cities
                return db.select().from(Cities).orderBy(Cities.population, lf.Order.ASC).exec();
            }).then(function(queryResult) {
          	  	return queryResult;
            }, function(error) {
                console.log('Error:' + error);
            });
        },
        // Returns a promise that resolves to the results of a query using the supplied predicate
        query: function(predicate) {
        	if (!predicate) {
            	return this.list();
            }
        	return $q.when(database.promise, function(db) {
                var Cities = db.getSchema().table('Cities');
                // Construct query with predicate
                return db.select().from(Cities).where(predicate).exec();
            }).then(function(queryResult){
            	return queryResult;
            }, function(error){
                console.log('Error:' + error);
            });
        },
        // Constructs a predicate using the supplied values - all parameters are required except for 'negate'
        constructPredicate: function(table, fieldName, operator, value, negate) {
        	var predicate = null;
            // Find the field the user selected
            var field = table[fieldName];
            // Default the queried value if appropriate
            if (value === undefined || value === null) {
                value = '';
            }
            // Pick an appropriate predicate function based on selected operator
            switch (operator) {
                case '=':
                    predicate = field.eq(value);
                    break;
                case '<':
                    predicate = field.lt(value);
                    break;
                case '<=':
                    predicate = field.lte(value);
                    break;
                case '>':
                    predicate = field.gt(value);
                    break;
                case '>=':
                    predicate = field.gte(value);
                    break;
                case 'MATCHES':
                    predicate = field.match(value);
                    break;
                case 'IS NULL':
                    predicate = field.isNull(value);
                    break;
            }
            // If user selected the negation checkbox, negate the predicate
            if (negate) {
                predicate = lf.op.not(predicate);
            }
            return predicate;
        }
    }
}
]);
