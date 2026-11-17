package com.sele906.chaekeodi.external.common;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;

@Mapper
public interface ApiUsageMapper {
    void increaseUsage(
            @Param("usageDate") LocalDate usageDate,
            @Param("provider") String provider,
            @Param("apiName") String apiName,
            @Param("failCount") int failCount,
            @Param("error") String error
    );
}
