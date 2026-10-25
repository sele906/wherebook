package com.sele906.chaekeodi.route.mapper;

import com.sele906.chaekeodi.route.domain.CandidateLibrary;
import com.sele906.chaekeodi.route.domain.RouteRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Collection;
import java.util.List;
import java.util.Map;

@Mapper
public interface RouteMapper {

    List<CandidateLibrary> searchLibraries(RouteRequest routeSearchRequest);
    List<Map<String, String>> getBooksByIsbns(@Param(value = "isbns") Collection<String> isbns);
}
