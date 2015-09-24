package com.objectpartners.plummer.lovefield;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collection;
import java.util.concurrent.atomic.AtomicLong;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(CitiesController.RESOURCE_ROOT_URL)
public class CitiesController {
    public static final String RESOURCE_ROOT_URL = "/cities";

    private static final Collection<City> CITIES = new ArrayList<>();
    static {
        CSVFormat csvFileFormat = CSVFormat.DEFAULT.withHeader(new String[]{"name", "state", "population"});

        try(InputStream input = CitiesController.class.getResourceAsStream("/cities.csv"); 
            InputStreamReader inputStreamReader = new InputStreamReader(input);
            CSVParser csvParser = new CSVParser(inputStreamReader, csvFileFormat);) {
            AtomicLong idGenerator = new AtomicLong(0);
            for (CSVRecord record : csvParser.getRecords()) {
                City city = new City(idGenerator.incrementAndGet(), record.get("name"), record.get("state"), Long.parseLong(record.get("population")));
                CITIES.add(city);
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {}
    }
    
    @RequestMapping(method = RequestMethod.GET)
    public Collection<City> list() {
        return CITIES;
    }
}
