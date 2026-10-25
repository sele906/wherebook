package com.sele906.chaekeodi.route.mapper;

import com.sele906.chaekeodi.route.domain.CandidateLibrary;
import com.sele906.chaekeodi.route.domain.RouteRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RouteMapper {

    List<CandidateLibrary> searchLibraries(RouteRequest routeSearchRequest);
    String getTitleByIsbn(@Param(value = "isbn13") String isbn13);
}
