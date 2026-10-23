package com.sele906.chaekeodi.user.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.UUID;

@Mapper
public interface UserMapper {
    int loginGuest(@Param("userId") UUID userId);
    void joinGuest(@Param("userId") UUID userId);
}
