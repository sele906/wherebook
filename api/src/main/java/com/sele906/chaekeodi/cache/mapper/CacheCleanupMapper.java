package com.sele906.chaekeodi.cache.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.OffsetDateTime;

@Mapper
public interface CacheCleanupMapper {
    int deletePopularBooks(
            @Param("before") OffsetDateTime before
    );
    int deleteHoldingRegions(
            @Param("before") OffsetDateTime before
    );
    int deleteHoldingLibraries(
            @Param("before") OffsetDateTime before
    );
    int deleteBookStatuses(
            @Param("before") OffsetDateTime before
    );
    int deleteCallNumbers(
            @Param("status") String status,
            @Param("before") OffsetDateTime before
    );
}
