# LovefieldExample
This application shows off Google's Lovefield Javascript relational database.

## Description
The application loads up a dataset of approximately 15,000 US cities including name, state, and population. The data is inserted into a Lovefield database so it can be queried. The 'Data' tab shows the entire contents of the database while the 'Try it Out' tab allows construction of complex custom queries to demonstrate the ability to quickly and easily filter data using Lovefield. Finally the 'Compare' tab allows you to execute three common operations using Lovefield and plain-old JavaScript to compare the execution time of each.

For more info take a look at the blog post this example was written for: https://objectpartners.com/2015/10/08/relational-data-management-with-lovefield/

## Usage
After cloning the repo, ensure you have Maven 3+ installed by running `mvn -version` in a command prompt. Grab it from [Apache](https://maven.apache.org/) if needed.

From a command prompt, enter the LovefieldExample directory you cloned and execute `mvn spring-boot:run`. After a short wait you should see something like the following: `Started Application in 2.542 seconds`. At this point, open a browser tab and navigate to http://localhost:8080/lovefield.

To quit, type `Ctrl-C` in the command prompt.

## Toolset
1. [Lovefield](https://google.github.io/lovefield/)
2. [AngularJS](https://angularjs.org/)
3. [Angular Material](https://material.angularjs.org/latest/#/)
4. [Spring Boot](http://projects.spring.io/spring-boot/)

## Data
City data acquired from https://panthema.net/2007/stx-exparser/csvdata/geonames-cities1000.csv. Modified to only use a subset of data for US cities.

## Licensing
This code is provided under the terms of the MIT license: basically you're free to do whatever you want with it, but no guarantees are made to its validity, stability, or safety. All works referenced by or utilized by this project are the property of their respective copyright holders and retain licensing that may be more restrictive.
