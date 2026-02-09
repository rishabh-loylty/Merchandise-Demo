package com.merchant.demo;

import com.merchant.demo.config.ShopifyAdapterProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
@EnableConfigurationProperties(ShopifyAdapterProperties.class)
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
