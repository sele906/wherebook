// 백엔드 응답 형태 (api/ 의 DTO와 맞춘다). JS라서 JSDoc으로만 적어둔다.

/**
 * @typedef {Object} BookSearchItem
 * @property {string} isbn13
 * @property {string} title
 * @property {string} authors
 * @property {string} publisher
 * @property {string} publicationYear
 * @property {string} imageUrl
 * @property {number} loanCount
 */

/**
 * @typedef {Object} BookSearchResponse
 * @property {BookSearchItem[]} books
 * @property {number} page
 * @property {number} size
 * @property {number} totalCount
 */

/**
 * @typedef {Object} Book
 * @property {string} isbn13
 * @property {string} title
 * @property {string} authors
 * @property {string} publisher
 * @property {string} publicationYear
 * @property {string} classNo
 * @property {string} className
 * @property {string} description
 * @property {string} imageUrl
 * @property {string} fetchedAt  ISO 날짜 문자열
 */

/**
 * @typedef {Object} LibrarySearchItem
 * @property {string} libCode
 * @property {string} name
 * @property {string} address
 * @property {string} tel
 * @property {string} fax
 * @property {string} homepage
 * @property {string} closedDays
 * @property {string} operatingTime
 * @property {number|null} latitude
 * @property {number|null} longitude
 * @property {string} dtlRegionCode
 * @property {number|null} distance  단위 m. 좌표 없이 검색하면 null
 */

/**
 * @typedef {Object} LibrarySearchResponse
 * @property {LibrarySearchItem[]} libraries
 * @property {number} page
 * @property {number} size
 * @property {number} totalCount
 */

/**
 * @typedef {Object} Library
 * @property {string} libCode
 * @property {string} name
 * @property {string} address
 * @property {string} tel
 * @property {string} fax
 * @property {string} homepage
 * @property {number|null} latitude
 * @property {number|null} longitude
 * @property {string} closedDays
 * @property {string} operatingTime
 * @property {number|null} bookCount
 * @property {string} regionCode
 * @property {string} dtlRegionCode
 * @property {string} createdAt  ISO 날짜 문자열
 * @property {string} updatedAt  ISO 날짜 문자열
 */

/**
 * @typedef {Object} LibrarySearchByBookResponse
 * @property {LibrarySearchItem[]} libraries
 * @property {number} totalCount
 */

/**
 * @typedef {Object} CallNumberItem
 * @property {string} callNumber  예: "아동 813.7-정67ㅊ" (별치 기호가 있으면 앞에 붙음)
 * @property {string|null} shelfLocation  배가 위치(자료실)
 * @property {number} copyCount  이 청구기호로 소장한 권수
 */

/**
 * @typedef {Object} CallNumberResponse
 * @property {string} status  OK / NOT_FOUND / ERROR
 * @property {CallNumberItem[]} items  복본 많은 순. OK가 아니면 빈 배열
 */

/**
 * @typedef {Object} LoanStatusResponse
 * @property {boolean} bookExists
 * @property {boolean} loanAvailable
 * @property {"OK"|"ERROR"} status
 */

/**
 * @typedef {Object} BorrowListItem
 * @property {string} isbn13
 * @property {string} imageUrl
 * @property {string} title
 * @property {string} authors
 * @property {string} publisher
 * @property {string} publicationYear
 * @property {string} addedAt  ISO 날짜 문자열
 */

/**
 * @typedef {Object} RouteBook
 * @property {string} isbn13
 * @property {string|null} title  우리 DB에 없는 책이면 null
 * @property {string|null} authors
 * @property {string|null} publisher
 * @property {string|null} publicationYear
 */

/**
 * @typedef {Object} RouteStop
 * @property {number} order  1부터
 * @property {string} libCode
 * @property {string} libName
 * @property {number} latitude
 * @property {number} longitude
 * @property {RouteBook[]} books  이 도서관에서 빌릴 책 (앞 도서관에서 빌리는 책은 빠짐)
 */

/**
 * @typedef {Object} AllAvailableBooksRoute  반경 안에서 대출 가능한 책을 모두 빌리는 동선 (최대 3곳)
 * @property {number} borrowableBookCount
 * @property {number} totalKm  기준 위치 → 도서관들 직선거리 합
 * @property {RouteStop[]} stops  방문 순서대로
 */

/**
 * @typedef {Object} BestSingleLibrary  한 곳만 간다면 — 대출 가능한 책이 가장 많은 도서관 (같으면 가까운 곳)
 * @property {string} libCode
 * @property {string} libName
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} distanceKm  기준 위치에서 직선거리
 * @property {RouteBook[]} books  여기서 빌릴 수 있는 책
 * @property {RouteBook[]} unavailableBooks  여기서 못 빌리는 책 (다른 곳에서 대출 가능·대출중·미소장 모두)
 */

/**
 * @typedef {Object} RouteResponse
 * @property {AllAvailableBooksRoute|null} allAvailableBooksRoute  빌릴 수 있는 책이 없으면 null
 * @property {BestSingleLibrary|null} bestSingleLibrary  빌릴 수 있는 책이 없으면 null
 * @property {RouteBook[]} onLoanNearby  반경 안에서 소장은 하지만 전부 대출중
 * @property {RouteBook[]} notFoundNearby  반경 안 도서관에 없음
 */

export {};
