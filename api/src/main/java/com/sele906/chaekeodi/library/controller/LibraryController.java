package com.sele906.chaekeodi.library.controller;

import com.sele906.chaekeodi.external.Data4LibraryClient;
import com.sele906.chaekeodi.library.domain.*;
import com.sele906.chaekeodi.library.mapper.LibraryMapper;
import com.sele906.chaekeodi.library.service.LibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/libraries")
public class LibraryController {

    private final Data4LibraryClient client;
    private final LibraryMapper libraryMapper;

    private final LibraryService libraryService;

    //도서관 db 업데이트용
    @PostMapping("/syncLibraries")
    public int syncLibraries() {
        return libraryService.syncLibraries();
    }

    //도서관 검색
    @GetMapping
    public ResponseEntity<LibrarySearchResponse> searchLibraries(
            @ModelAttribute LibrarySearchRequest request
    ) {
        LibrarySearchResponse response = libraryService.searchLibraries(request);
        return ResponseEntity.ok(response);
    }

    //도서관 상세정보
    @GetMapping("/{libCode}")
    public ResponseEntity<Library> getLibrary(
            @PathVariable("libCode") String libCode
    ) {
        Library response = libraryService.getLibrary(libCode);
        return ResponseEntity.ok(response);
    }

}
