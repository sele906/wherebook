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
 * @typedef {Object} CallNumberResponse
 * @property {string|null} callNumber  예: "813.7-정67ㅊ"
 * @property {string|null} shelfLocation  배가 위치
 * @property {string} status  OK / NOT_FOUND / ERROR
 */

/**
 * @typedef {Object} LoanStatusResponse
 * @property {boolean} bookExists
 * @property {boolean} loanAvailable
 * @property {"OK"|"ERROR"} status
 */

export {};
