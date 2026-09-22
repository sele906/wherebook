package com.sele906.api.library.mapper;

import com.sele906.api.library.domain.Library;
import com.sele906.api.library.domain.LibrarySearchItem;
import com.sele906.api.library.domain.LibrarySearchRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LibraryMapper {
    int upsertLibrary(Library library);
    List<LibrarySearchItem> searchLibraries(LibrarySearchRequest request);
    int countLibraries(LibrarySearchRequest request);
    Library getLibraryByLibCode(String libCode);
}
