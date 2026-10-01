package com.sele906.chaekeodi.holding.mapper;

import com.sele906.chaekeodi.holding.domain.BookCallNumber;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface HoldingMapper {
    BookCallNumber findCallNumber(@Param("libCode") String libCode,
                                  @Param("isbn13") String isbn13);
    void upsertCallNumber(BookCallNumber callNumber);
}
