package com.objectpartners.plummer.lovefield;

public class City {
    private final Long id;
    private final String name;
    private final String state;
    private final Long population;
    
    public City(Long id, String name, String state, Long population) {
        this.id = id;
        this.name = name;
        this.state = state;
        this.population = population;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getState() {
        return state;
    }

    public Long getPopulation() {
        return population;
    }
}
