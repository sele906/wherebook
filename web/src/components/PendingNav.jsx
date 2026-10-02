'use client';

import { createContext, use, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/*
 * 같은 화면 안에서 검색어·반경·페이지만 바뀌는 이동을 누르는 즉시 "불러오는 중"으로 보여준다.
 *
 * 왜 필요한가: 같은 경로 안의 이동(/libraries → /libraries?r=5)은 loading.jsx가 다시 뜨지 않아서
 * 서버 응답의 첫 조각(스켈레톤)이 와야 화면이 바뀐다. 네트워크가 느리거나, 백신 같은 보안 프로그램이
 * 응답을 모았다가 넘기면 그동안 이전 결과가 멈춘 듯 보인다. 그래서 이동을 transition으로 감싸고
 * 기다리는 동안 브라우저가 직접 결과 자리를 스켈레톤으로 바꾼다.
 *
 * <PendingNavProvider>  이동 상태를 가진 범위
 * <PendingLink>         누르면 provider를 통해 이동 (새 탭 열기 등은 기본 동작, provider 밖이면 일반 Link)
 * <PendingForm>         GET 폼. 제출하면 provider를 통해 이동 (JS 없으면 일반 폼)
 * <PendingSwap>         이동 중이면 fallback, 아니면 children
 */

const PendingContext = createContext({ isPending: false, navigate: null });

export function PendingNavProvider({ children }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    function navigate(href) {
        startTransition(() => router.push(href));
    }

    return <PendingContext value={{ isPending, navigate }}>{children}</PendingContext>;
}

export function PendingLink({ href, onClick, ...rest }) {
    const { navigate } = use(PendingContext);

    function handleClick(e) {
        onClick?.(e);
        if (e.defaultPrevented || !navigate) return;
        // 새 탭·새 창 열기는 브라우저 기본 동작 그대로
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(href);
    }

    return <Link href={href} onClick={handleClick} {...rest} />;
}

export function PendingForm({ action, children, ...rest }) {
    const { navigate } = use(PendingContext);

    function handleSubmit(e) {
        if (!navigate) return;
        e.preventDefault();
        // 빈 값은 주소에서 뺀다 (/libraries?q= → /libraries)
        const params = new URLSearchParams();
        for (const [key, value] of new FormData(e.currentTarget)) {
            if (typeof value === 'string' && value.trim() !== '') params.append(key, value.trim());
        }
        const query = params.toString();
        navigate(query ? `${action}?${query}` : action);
    }

    return (
        <form action={action} onSubmit={handleSubmit} {...rest}>
            {children}
        </form>
    );
}

export function PendingSwap({ fallback, children }) {
    const { isPending } = use(PendingContext);
    return isPending ? fallback : children;
}
