import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    burst: {
      executor: 'per-vu-iterations',
      vus: 50,
      iterations: 1,      // 각자 딱 한 번, 동시에
    },
  },
};

const BASE = 'http://app:8080/api';
const ISBN = '9788956604992';
const LIB = '123002';

//api 별 경로
const TARGETS = {
  detail:    `${BASE}/books/${ISBN}`,
  popular: `${BASE}/books/popular?pageNo=1&pageSize=6`,
  holding: `${BASE}/books/${ISBN}/libraries?regionCode=11&dtlRegionCode=11010`,
  loan:    `${BASE}/books/${ISBN}/libraries/${LIB}/loan-status`,
  callno:  `${BASE}/books/${ISBN}/libraries/${LIB}/call-number`,
};

const target = __ENV.TARGET || 'loan';

export default function () {
  const res = http.get(TARGETS[target]);
  check(res, { '200': (r) => r.status === 200 });
  if (res.status !== 200) console.log(target, res.status, res.body.substring(0, 200));
}