package com.sele906.chaekeodi.external.common;

import org.apache.ibatis.annotations.Mapper;

import java.time.LocalDate;

@Mapper
public interface ApiUsageMapper {
    void increaseUsage(LocalDate usageDate, String provider, String apiName, int failCount, String error);
}
