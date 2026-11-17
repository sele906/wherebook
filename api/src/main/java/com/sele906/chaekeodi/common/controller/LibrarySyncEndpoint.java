package com.sele906.chaekeodi.common.controller;

import com.sele906.chaekeodi.library.service.LibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.endpoint.annotation.Endpoint;
import org.springframework.boot.actuate.endpoint.annotation.WriteOperation;
import org.springframework.stereotype.Component;

@Component
@Endpoint(id = "librarysync")
@RequiredArgsConstructor
public class LibrarySyncEndpoint {

    private final LibraryService libraryService;

    // POST /actuator/librarysync
    @WriteOperation
    public int sync() {
        return libraryService.syncLibraries();
    }
}
