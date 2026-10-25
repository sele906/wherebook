package com.sele906.chaekeodi.library.domain;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LibrarySearchResponse {
    private List<LibrarySearchItem> libraries;
    private int page;
    private int size;
    private int totalCount;
}
