package com.sele906.chaekeodi.common.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ConnectionRepository {

    private final JdbcTemplate jdbcTemplate;

    public Integer connectionTest() {
        return jdbcTemplate.queryForObject(
                "SELECT 1",
                Integer.class
        );
    }
}
