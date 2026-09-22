package com.sele906.api.library.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
