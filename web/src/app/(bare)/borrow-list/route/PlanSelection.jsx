'use client';

import { createContext, use, useState } from 'react';

/*
 * 고른 안 — 'all'(N권 다 빌리기) / 'single'(한 곳만 가기).
 * 카드(aria-pressed 버튼)가 바꾸고, 나중에 지도가 읽어서 그 안의 핀·경로만 그린다.
 * 카드와 지도가 서로 다른 Suspense 안에 있어서 둘을 감싸는 이 provider가 상태를 가진다.
 * TODO: 지도 디자인 단계에서 RouteMap이 usePlanSelection()으로 고른 안만 그리기
 */

const PlanSelectionContext = createContext({ plan: 'all', setPlan: () => {} });

export function PlanSelectionProvider({ children }) {
    const [plan, setPlan] = useState('all');
    return <PlanSelectionContext value={{ plan, setPlan }}>{children}</PlanSelectionContext>;
}

export function usePlanSelection() {
    return use(PlanSelectionContext);
}
