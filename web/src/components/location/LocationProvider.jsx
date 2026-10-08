'use client';

import { createContext, startTransition, use, useEffect, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import {
    getLocationServerSnapshot,
    getLocationSnapshot,
    subscribeLocation,
    syncBaseCookie,
} from '@/lib/locationStore';

import LocationDialog from './LocationDialog';

/*
 * 기준 위치 고르기 창(LocationDialog)을 화면에 하나만 두고, 어디서든 열 수 있게 한다.
 * AppFrame이 감싸므로 (shell)·(bare) 모든 화면에서 LocationChip 등이 쓸 수 있다.
 *
 * 기준이 바뀌면(이 탭이든 다른 탭이든) 쿠키를 맞추고 서버 화면을 다시 불러온다 (router.refresh).
 * 모든 쓰기가 이 한 곳을 거치므로 화면마다 따로 새로고침할 필요가 없다.
 */
const OpenContext = createContext(() => {});

// 지금 기준 위치 상태. 서버 렌더링·하이드레이션 중에는 null (localStorage를 아직 모름)
export function useLocationState() {
    return useSyncExternalStore(subscribeLocation, getLocationSnapshot, getLocationServerSnapshot);
}

export function useOpenLocationPicker() {
    return use(OpenContext);
}

export default function LocationProvider({ children }) {
    const dialogRef = useRef(null);
    const router = useRouter();
    const state = useLocationState();

    useEffect(() => {
        if (state && syncBaseCookie(state.base)) {
            startTransition(() => router.refresh());
        }
    }, [state, router]);

    // 닫히면 브라우저가 연 버튼으로 포커스를 돌려준다 (<dialog>의 기본 동작)
    function open() {
        const dialog = dialogRef.current;
        if (!dialog || dialog.open) return;
        dialog.showModal();
        // 첫 포커스는 제목으로 — 검색창이면 모바일 키보드가 바로 올라와 시트를 가림
        dialog.querySelector('h2')?.focus();
    }

    return (
        <OpenContext value={open}>
            {children}
            <LocationDialog ref={dialogRef} state={state} />
        </OpenContext>
    );
}
