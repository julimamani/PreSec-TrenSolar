package com.app.agtech;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class AgtechBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(AgtechBackendApplication.class, args);
	}

}
