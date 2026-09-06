package com.sele906.api.library.mapper;

import com.sele906.api.library.domain.Library;
import com.sele906.api.library.domain.LibrarySearchRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LibraryMapper {
    int insertLibrary(Library library);
    List<Library> searchLibraries(LibrarySearchRequest request);
    Library getLibraryByLibCode(String libCode);
}
