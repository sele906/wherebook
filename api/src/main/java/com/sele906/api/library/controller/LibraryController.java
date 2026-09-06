package com.sele906.api.library.controller;

import com.sele906.api.library.domain.LibrarySearchRequest;
import com.sele906.api.library.service.LibraryService;
import com.sele906.api.library.domain.Library;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/libraries")
public class LibraryController {

    private final LibraryService libraryService;

    @PostMapping("/syncLibraries")
    public int syncLibraries() {
        return libraryService.syncLibraries();
    }

    @GetMapping
    public ResponseEntity<List<Library>> searchLibraries(
            @ModelAttribute LibrarySearchRequest request
    ) {
        List<Library> response = libraryService.searchLibraries(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{libCode}")
    public ResponseEntity<Library> getLibrary(
            @PathVariable("libCode") String libCode
    ) {
        Library response = libraryService.getLibrary(libCode);
        return ResponseEntity.ok(response);
    }

}
