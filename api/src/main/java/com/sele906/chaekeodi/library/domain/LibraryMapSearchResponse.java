package com.sele906.chaekeodi.library.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LibraryMapSearchResponse {
    private List<LibraryMapSearchItem> libraries;
    private int totalCount;
}
