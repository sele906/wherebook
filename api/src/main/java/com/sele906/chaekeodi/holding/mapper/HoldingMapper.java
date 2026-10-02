package com.sele906.chaekeodi.holding.mapper;

import com.sele906.chaekeodi.holding.domain.BookCallNumber;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface HoldingMapper {
    BookCallNumber findCallNumber(@Param("libCode") String libCode,
                                  @Param("isbn13") String isbn13);
    void upsertCallNumber(BookCallNumber callNumber);
    List<String> findNearestRegionWithLocationAndRadius(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("radius") Integer radius
    );
}
