'use client';

import Form from 'next/form';

import { addRecentSearch } from '@/lib/recentSearches';

import { PendingForm } from './PendingNav';

/*
 * 제출할 때 검색어(name="q")를 최근 검색어에 저장하는 검색 폼.
 * pending: 검색 결과 화면처럼 PendingNavProvider 안이면 PendingForm, 아니면 next/form.
 * 안의 입력창·버튼은 서버 컴포넌트가 그대로 넘긴다.
 */
export default function RecentSearchForm({ pending = false, ...props }) {
    const FormComponent = pending ? PendingForm : Form;

    function handleSubmit(e) {
        addRecentSearch(new FormData(e.currentTarget).get('q'));
    }

    return <FormComponent {...props} onSubmit={handleSubmit} />;
}
