package com.sele906.chaekeodi.external;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class Data4LibraryConfig {

    @Bean
    public RestClient data4LibraryRestClient() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(15));

        return RestClient.builder()
                .baseUrl("http://data4library.kr/api")
                .requestFactory(factory)
                .build();
    }
}
