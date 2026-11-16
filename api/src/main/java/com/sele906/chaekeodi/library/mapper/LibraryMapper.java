package com.sele906.chaekeodi.library.mapper;

import com.sele906.chaekeodi.holding.domain.LibrarySearchByBookRequest;
import com.sele906.chaekeodi.holding.domain.Region;
import com.sele906.chaekeodi.library.domain.*;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Collection;
import java.util.List;
import java.util.Set;

@Mapper
public interface LibraryMapper {
    boolean upsertLibrary(Library library);
    List<LibrarySearchItem> searchLibraries(LibrarySearchRequest request);
    List<LibraryMapSearchItem> searchLibrariesInMap(LibrarySearchRequest request);
    int countLibraries(LibrarySearchRequest request);
    Library getLibraryByLibCode(String libCode);
    List<Region> findAllDtlRegions();
    int deleteRegionFetches(@Param("regions") Collection<Region> regions);
}
