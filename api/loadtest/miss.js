import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m',  target: 30 },
    { duration: '1m',  target: 50 },
    { duration: '20s', target: 0 },
  ],
};

// 체크 숫자까지 맞는 랜덤 ISBN-13 (앱이 ISBN을 검증해도 통과하도록)
function randomIsbn() {
  let s = '979';
  for (let i = 0; i < 9; i++) s += Math.floor(Math.random() * 10);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
  return s + ((10 - (sum % 10)) % 10);
}

export default function () {
  const isbn = randomIsbn();
  const res = http.get(`http://app:8080/api/books/${isbn}/libraries/123002/loan-status`);
  if (res.status !== 200) console.log(res.status, res.url, res.body.substring(0, 200));
  check(res, { '200': (r) => r.status === 200 });
  sleep(1);
}