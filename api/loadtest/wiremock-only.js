import http from 'k6/http';
import { sleep } from 'k6';
export const options = { vus: 50, duration: '30s' };
export default function () {
  http.get('http://wiremock:8080/api/bookExist?isbn13=1&libCode=1');
  sleep(1);
}