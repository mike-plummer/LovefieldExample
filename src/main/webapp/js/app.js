'use strict';

/* App Module */

var lovefieldApp = angular.module('lovefieldApp', [
                                                   'ngMaterial',
                                                   'ui.router',
                                                   'ui.grid',
                                                   'services',
                                                   'controllers',
                                                   'database',
                                                   'directives',
                                                   'interceptors'
                                                   ]);

lovefieldApp.config(['$httpProvider', '$stateProvider', '$urlRouterProvider', '$mdThemingProvider',
                     function($httpProvider, $stateProvider, $urlRouterProvider, $mdThemingProvider) {

    /*
     * Setup Angular UI Router
     */

    //When no routes are matched, send to default
    $urlRouterProvider.otherwise("/summary");

    // Setup all states (one per cache type). Each one sends the user to the same
    // template but configures a different controller. Angular is awesome!!
    $stateProvider
    .state('summary', {
        url: "/summary",
        templateUrl: "partials/summary.html",
        controller: 'SummaryController as Controller'
    })
    .state('data', {
        url: "/data",
        templateUrl: "partials/data.html",
        controller: 'DataController as Controller'
    })
    .state('try', {
        url: "/try",
        templateUrl: "partials/try.html",
        controller: 'TryController as Controller'
    })
    .state('compare', {
        url: "/compare",
        templateUrl: "partials/compare.html",
        controller: 'ComparisonController as Controller'
    });

    /*
     * End UI Router configuration.
     */

    // Add a simple interceptor just for convenience during development - this has no functional purpose.
    $httpProvider.interceptors.push('serviceCallInterceptor');

    // Theming
    $mdThemingProvider.theme('myTheme', 'default')
    .primaryPalette('blue')
    .accentPalette('light-blue')
    .warnPalette('red')
    .backgroundPalette('grey');
    $mdThemingProvider.setDefaultTheme('myTheme');
}]);
