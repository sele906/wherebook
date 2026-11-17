package com.sele906.chaekeodi.library.service;

import com.sele906.chaekeodi.common.exception.ResponseNotFoundException;
import com.sele906.chaekeodi.common.exception.ExternalApiException;
import com.sele906.chaekeodi.external.data4library.Data4LibraryClient;
import com.sele906.chaekeodi.holding.domain.Region;
import com.sele906.chaekeodi.library.domain.*;
import com.sele906.chaekeodi.library.mapper.LibraryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class LibraryService {

    private final LibraryMapper libraryMapper;
    private final Data4LibraryClient client;
    private final TransactionTemplate tx;

    public int syncLibraries() {
        List<Region> regions = libraryMapper.findAllDtlRegions();  // 지역코드 테이블
        Set<Region> regionsWithNewLibs = new HashSet<>();
        int processed = 0;

        for (Region region : regions) {
            try {
                int pageNo = 1, pageSize = 100;

                while (true) {
                    var page = client.fetchLibraries(region, pageNo, pageSize);

                    for (Library lib : page.libraries()) {
                        lib.setRegionCode(region.getRegionCode());
                        lib.setDtlRegionCode(region.getDtlRegionCode());

                        tx.executeWithoutResult(s -> {
                            boolean inserted = libraryMapper.upsertLibrary(lib);
                            if (inserted) {
                                regionsWithNewLibs.add(region);
                                libraryMapper.deleteRegionFetches(region);
                            }
                        });

                        processed++;
                    }

                    log.info("libSrch page={} 지역도서관={} 전체누적={}", pageNo, page.numFound(), processed);

                    if (pageNo * pageSize >= page.numFound()) break;
                    pageNo++;
                }

            } catch (ExternalApiException e) {
                log.warn("도서관 동기화 실패, 건너뜀 region={}", region, e);
            }
        }

        log.info("도서관 동기화 완료 processed={} 신규도서관지역={}", processed, regionsWithNewLibs);

        return processed;
    }

    public LibrarySearchResponse searchLibraries(LibrarySearchRequest req) {
        List<LibrarySearchItem> list = libraryMapper.searchLibraries(req);
        int total = libraryMapper.countLibraries(req);
        return new LibrarySearchResponse(list, req.getPage(), req.getSize(), total);
    }

    public LibraryMapSearchResponse searchLibrariesInMap(LibrarySearchRequest req) {
        List<LibraryMapSearchItem> list = libraryMapper.searchLibrariesInMap(req);
        int total = libraryMapper.countLibraries(req);
        return new LibraryMapSearchResponse(list, total);
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