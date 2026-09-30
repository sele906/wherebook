package com.sele906.chaekeodi.library.mapper;

import com.sele906.chaekeodi.holding.domain.LibrarySearchByBookRequest;
import com.sele906.chaekeodi.library.domain.*;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LibraryMapper {
    int upsertLibrary(Library library);
    List<LibrarySearchItem> searchLibraries(LibrarySearchRequest request);
    int countLibraries(LibrarySearchRequest request);
    Library getLibraryByLibCode(String libCode);
    List<LibrarySearchItem> searchLibByDistance(LibrarySearchByBookRequest request);
}
