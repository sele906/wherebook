// hit.js
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

export default function () {
  const res = http.get('http://app:8080/api/books/9788956604992/libraries/123002/loan-status');
  check(res, { '200': (r) => r.status === 200 });
  sleep(1);
}