package com.example.api_gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "jwt_secret_key=talentprep_test_jwt_secret_key_min_256_bits_length",
    "JWT_SECRET_KEY=talentprep_test_jwt_secret_key_min_256_bits_length",
    "spring.data.redis.host=localhost",
    "spring.data.redis.port=6379",
    "redis_username=",
    "redis_password="
})
class ApiGatewayApplicationTests {

	@Test
	void contextLoads() {
	}

}
