package com.sele906.chaekeodi;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;

public class Data4LibraryApiTest {

    @Test
    void 정보공개_도서관을_조회한다() {

        //given
        //테스트에 필요한 조건 준비
        String authKey = System.getenv("LIB_API_KEY");

        assertThat(authKey)
                .as("api 키 환경변수가 설정되어 있어야 합니다")
                .isNotBlank();

        RestClient restClient = RestClient.builder()
                .baseUrl("https://data4library.kr")
                .build();

        //when
        //진짜 검사하고 싶은 코드 실행
        ResponseEntity<String> response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/libSrch")
                        .queryParam("authKey", authKey)
                        .queryParam("pageNo", 1)
                        .queryParam("pageSize", 2)
                        .queryParam("format", "json")
                        .build())
                .retrieve()
                .toEntity(String.class);

        //then
        //결과가 내가 예상한 값인지 확인
        assertThat(response.getStatusCode())
                .isEqualTo(HttpStatus.OK);

        assertThat(response.getBody())
                .isNotBlank();

        System.out.println(response.getBody());
    }
}
