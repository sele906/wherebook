package com.sele906.chaekeodi.holding.mapper;

import com.sele906.chaekeodi.holding.domain.*;
import com.sele906.chaekeodi.library.domain.LibrarySearchItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Mapper
public interface HoldingMapper {
    BookCallNumber findCallNumber(@Param("libCode") String libCode,
                                  @Param("isbn13") String isbn13);
    void upsertCallNumber(BookCallNumber callNumber);

    Set<Region> findFreshRegions(
            @Param("isbn13") String isbn13,
            @Param("regions")List<Region> regions
    );
    List<String> getHoldingLibCodes(
            @Param("isbn13") String isbn13,
            @Param("regions")List<Region> regions
    );
    void deleteHoldings(
            @Param("isbn13") String isbn13,
            @Param("region") Region region
    );
    void insertHoldings(List<HoldingLibraryItem> items);
    List<Region> findRegionsNear(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("radius") Integer radius
    );
    void upsertRegionFetch(
            @Param("isbn13") String isbn13,
            @Param("region") Region region
    );
    List<LibrarySearchItem> searchLibByDistance(LibrarySearchByBookRequest request);

    void deleteCallNumberItems(String libCode, String isbn13);
    void insertCallNumberItems(List<BookCallNumberItem> items);
    List<BookCallNumberItem> findCallNumberItems(String libCode, String isbn13);

    List<HoldingLibraryItem> getHoldingLibCodesBulk(
            @Param("isbns") List<String> isbns,
            @Param("regions") List<Region> regions
    );

    List<LoanStatus> getFreshStatuses(
            @Param("keys") Collection<BookLib> keys
    );
    void upsertStatus(LoanStatus status);
}
