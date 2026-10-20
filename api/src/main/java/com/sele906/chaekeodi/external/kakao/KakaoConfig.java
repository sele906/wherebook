package com.sele906.chaekeodi.external.kakao;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class KakaoConfig {

    @Value("${kakao.api.auth-key}")
    private String authKey;

    @Bean
    public RestClient kakaoRestClient() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(15));

        return RestClient.builder()
                .baseUrl("https://dapi.kakao.com")
                .requestFactory(factory)
                .defaultHeader("Authorization", "KakaoAK " + authKey)
                .build();
    }
}
