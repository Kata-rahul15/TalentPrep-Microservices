package com.example.api_gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "JWT_SECRET_KEY=talentprep_test_jwt_secret_key_min_256_bits_length"
})
class ApiGatewayApplicationTests {

	@Test
	void contextLoads() {
	}

}
