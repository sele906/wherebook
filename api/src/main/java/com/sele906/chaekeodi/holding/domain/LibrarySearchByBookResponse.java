package com.sele906.chaekeodi.holding.domain;

import com.sele906.chaekeodi.library.domain.LibrarySearchItem;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LibrarySearchByBookResponse {
    private List<LibrarySearchItem> libraries;
    private int totalCount;
}
