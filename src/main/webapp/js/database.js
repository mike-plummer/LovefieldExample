'use strict';

/* Database */

angular.module('database', ['services'])
.factory('Database', ['$q', 'CityService',
                      function($q, CityService){
    var schemaBuilder = lf.schema.create('data', 1);
    schemaBuilder.createTable('Cities')
      .addColumn('id', lf.Type.NUMBER)
      .addColumn('name', lf.Type.STRING)
      .addColumn('state', lf.Type.STRING)
      .addColumn('population', lf.Type.NUMBER)
      .addPrimaryKey(['id'])
      .addIndex('idxName', ['name'], false, lf.Order.DESC)
      .addIndex('idxState', ['state'], false, lf.Order.DESC);

    var database = $q.defer();
    schemaBuilder.connect().then(function(db) {
        var Cities = db.getSchema().table('Cities');
        CityService.list(null, function(cities) {
            var cityRows = [];
            cities.forEach(function(city) {
                cityRows.push(Cities.createRow(city));
            });
            db.insertOrReplace().into(Cities).values(cityRows).exec().then(
                    function() {
                        console.log('Data loaded');
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
        info: function() {
            var info = {
                    'size': 0
            };
            return $q.when(database.promise, function(db) {
                var Cities = db.getSchema().table('Cities');
                return db.select(lf.fn.count(Cities.id)).from(Cities).exec();
            }).then(function(queryResult){
                var count = queryResult[0]['COUNT(id)'];
                info['size'] += count;

                return info;
            });
        },
        getConnection: function() {
            return database.promise;
        },
        list: function(tableName) {
            return $q.when(database.promise, function(db) {
                var table = db.getSchema().table(tableName);
                return db.select().from(table).exec();
            }).then(function(queryResult){
                return queryResult;
            });
        }
    }
}
]);
