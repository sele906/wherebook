package com.sele906.chaekeodi.library.mapper;

import com.sele906.chaekeodi.library.domain.Library;
import com.sele906.chaekeodi.library.domain.LibrarySearchItem;
import com.sele906.chaekeodi.library.domain.LibrarySearchRequest;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface LibraryMapper {
    int upsertLibrary(Library library);
    List<LibrarySearchItem> searchLibraries(LibrarySearchRequest request);
    int countLibraries(LibrarySearchRequest request);
    Library getLibraryByLibCode(String libCode);
}
