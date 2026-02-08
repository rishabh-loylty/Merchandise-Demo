package com.merchant.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {

		Dotenv dotenv = Dotenv.configure()
			.ignoreIfMissing() // Don't crash if file is missing (e.g., in Prod/Docker)
			.load();
		dotenv.entries().forEach(entry -> 
			System.setProperty(entry.getKey(), entry.getValue())
		);

		SpringApplication.run(DemoApplication.class, args);
	}

}
