package com.sele906.chaekeodi.library.service;

import com.sele906.chaekeodi.common.exception.ResponseNotFoundException;
import com.sele906.chaekeodi.external.Data4LibraryClient;
import com.sele906.chaekeodi.library.domain.Library;
import com.sele906.chaekeodi.library.domain.LibrarySearchItem;
import com.sele906.chaekeodi.library.domain.LibrarySearchRequest;
import com.sele906.chaekeodi.library.domain.LibrarySearchResponse;
import com.sele906.chaekeodi.library.mapper.LibraryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LibraryService {

    private final LibraryMapper libraryMapper;
    private final Data4LibraryClient client;

    public int syncLibraries() {
        int pageNo = 1, pageSize = 100, processed = 0;

        while (true) {
            var page = client.fetchLibraries(pageNo, pageSize);
            for (Library lib : page.libraries()) {
                processed += libraryMapper.upsertLibrary(lib);
            }
            log.info("libSrch page={} 누적={}/{}", pageNo, processed, page.numFound());

            if (pageNo * pageSize >= page.numFound()) break;
            pageNo++;
        }

        return processed;
    }

    public LibrarySearchResponse searchLibraries(LibrarySearchRequest req) {
        List<LibrarySearchItem> list = libraryMapper.searchLibraries(req);
        int total = libraryMapper.countLibraries(req);
        return new LibrarySearchResponse(list, req.getPage(), req.getSize(), total);
    }

    public Library getLibrary(String libCode) {
        Library library = libraryMapper.getLibraryByLibCode(libCode);

        if (library == null) {
            throw new ResponseNotFoundException(
                    "도서관을 찾을 수 없습니다. libCode: " + libCode
            );
        }

        return library;
    }
}