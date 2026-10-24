package com.sele906.chaekeodi.borrowList.mapper;

import com.sele906.chaekeodi.borrowList.domain.BorrowListItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.UUID;

@Mapper
public interface BorrowListMapper {
    List<BorrowListItem> getBorrowListByUserId (@Param("userId") UUID userId);
    void addItem(@Param("isbn13") String isbn13, @Param("userId") UUID userId);
    void deleteItem(@Param("isbn13") String isbn13, @Param("userId") UUID userId);
}
