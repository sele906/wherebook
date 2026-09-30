package com.sele906.chaekeodi.holding.service;

import com.sele906.chaekeodi.external.Data4LibraryClient;
import com.sele906.chaekeodi.holding.domain.LibrarySearchByBookRequest;
import com.sele906.chaekeodi.holding.domain.LibrarySearchByBookResponse;
import com.sele906.chaekeodi.library.domain.LibrarySearchItem;
import com.sele906.chaekeodi.library.mapper.LibraryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HoldingService {

    private final LibraryMapper libraryMapper;
    private final Data4LibraryClient client;

    public LibrarySearchByBookResponse searchLibByBook(String isbn13, LibrarySearchByBookRequest req) {

        //인접 지역 소장 도서관 코드 모두 불러오기 (매우 많음)
        List<String> libCodes = client.fetchLibByBook(isbn13, req.getRegion());

        if (libCodes.isEmpty()) {
            return new LibrarySearchByBookResponse(List.of(), 0);
        }

        req.setLibCodes("{" + String.join(",", libCodes) + "}");

        //테스트용
        //사용자 위치 제공되었을 경우 제공되지 않았을 경우 생각해야함
        req.setLatitude(37.4849972);
        req.setLongitude(126.7045879);
        req.setRadius(10000);

        //위치로 필터
        List<LibrarySearchItem> libraries = libraryMapper.searchLibByDistance(req);

        return new LibrarySearchByBookResponse(libraries, libraries.size());
    }
}
