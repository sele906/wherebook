'use client';

import { useEffect, useId, useRef, useState } from 'react';

import {
    MAX_SAVED,
    removeLocation,
    renameLocation,
    saveLocation,
    selectDefault,
    selectSaved,
    selectTemp,
} from '@/lib/locationStore';
import { BASE_LABEL_MAX, DEFAULT_BASE } from '@/lib/location';

import { BackIcon, CloseIcon, EditIcon, LandmarkIcon, PinIcon, PlusIcon, SearchIcon } from '../icons';
import { findPlaces } from './actions';
import { LocationIcon } from './display';
import styles from './LocationDialog.module.css';

/*
 * 기준 위치 고르기 창. 모바일은 아래에서 올라오는 시트, 웹(1024px~)은 가운데 창.
 * <dialog>.showModal()이라 포커스가 안에 갇히고, Esc로 닫히고, 닫히면 연 버튼으로 돌아간다.
 *
 * 화면 3개를 한 창 안에서 바꿔 끼운다:
 *   list — 장소 검색 + 저장한 위치(라디오) + 이번만 쓰는 위치 + 기본값
 *   save — 검색 결과 하나를 이름 붙여 저장 / 이번만 쓰기
 *   edit — 저장한 위치 이름 바꾸기 / 삭제
 *
 * GPS(현재 위치 사용)는 넣지 않았다 — lib/location.js 설명 참고.
 * TODO: "위치 정보는 어떻게 쓰이나요?" — 개인정보 처리방침 화면이 생기면 아래 안내 문구 끝에 링크.
 * TODO: 위치 저장·편집 화면의 지도 미리보기(핀 옮기기) — 지도 작업 때 추가. 지금은 주소 글자만.
 * TODO: 바텀시트 세 높이(요약/절반/전체)와 끌어서 닫기 — 지금은 한 높이 고정.
 */

const QUICK_LABELS = ['집', '회사', '학교', '도서관'];
const SEARCH_DELAY_MS = 250;
const STORAGE_ERROR = '이 브라우저에서는 위치를 저장할 수 없어요. 사생활 보호 모드를 끄고 다시 해 보세요.';

export default function LocationDialog({ ref, state }) {
    const [view, setView] = useState({ name: 'list' });
    const titleId = useId();

    function close() {
        ref.current?.close();
    }

    // 배경(::backdrop)을 누르면 닫힘 — 그때 클릭 대상은 <dialog> 자신
    function onClick(e) {
        if (e.target === e.currentTarget) close();
    }

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            onClick={onClick}
            onClose={() => setView({ name: 'list' })}
            className={styles.dialog}
        >
            <div className={styles.sheet}>
                <div className={styles.handle} aria-hidden="true" />
                {/* 서버 렌더링 중(state 없음)에는 창이 닫혀 있으므로 비워 둠 */}
                {state && view.name === 'list' && (
                    <ListView
                        titleId={titleId}
                        state={state}
                        onClose={close}
                        onPick={(place) => setView({ name: 'save', place })}
                        onEdit={(id) => setView({ name: 'edit', id })}
                    />
                )}
                {state && view.name === 'save' && (
                    <SaveView
                        titleId={titleId}
                        place={view.place}
                        full={state.saved.length >= MAX_SAVED}
                        onBack={() => setView({ name: 'list' })}
                        onClose={close}
                    />
                )}
                {state && view.name === 'edit' && (
                    <EditView
                        titleId={titleId}
                        location={state.saved.find((loc) => loc.id === view.id)}
                        onBack={() => setView({ name: 'list' })}
                    />
                )}
            </div>
        </dialog>
    );
}

/* ---------------- list ---------------- */

function ListView({ titleId, state, onClose, onPick, onEdit }) {
    const [query, setQuery] = useState('');
    const [search, setSearch] = useState({ status: 'idle', places: [] });
    const [error, setError] = useState('');
    const searchRef = useRef(null);
    const timerRef = useRef(null);
    const requestRef = useRef(0);

    // 닫히면 대기 중인 검색을 버림
    useEffect(() => () => clearTimeout(timerRef.current), []);

    async function runSearch(text) {
        const id = ++requestRef.current;
        setSearch((prev) => ({ ...prev, status: 'loading' }));
        try {
            const places = await findPlaces(text);
            if (id === requestRef.current) setSearch({ status: 'done', places });
        } catch {
            if (id === requestRef.current) setSearch({ status: 'error', places: [] });
        }
    }

    function onChange(e) {
        const text = e.target.value;
        setQuery(text);
        clearTimeout(timerRef.current);
        if (!text.trim()) {
            requestRef.current++;
            setSearch({ status: 'idle', places: [] });
            return;
        }
        timerRef.current = setTimeout(() => runSearch(text), SEARCH_DELAY_MS);
    }

    function onSubmit(e) {
        e.preventDefault();
        clearTimeout(timerRef.current);
        if (query.trim()) runSearch(query);
    }

    function clearQuery() {
        clearTimeout(timerRef.current);
        requestRef.current++;
        setQuery('');
        setSearch({ status: 'idle', places: [] });
        searchRef.current?.focus();
    }

    // 고르면 바로 기준이 바뀜. 클릭·Enter면 창도 닫고, 화살표로 옮길 때는 열어 둠
    function choose(select, { keepOpen = false } = {}) {
        try {
            select();
            setError('');
            if (!keepOpen) onClose();
        } catch {
            setError(STORAGE_ERROR);
        }
    }

    const { saved, active, base } = state;
    const options = [
        ...saved.map((loc) => ({
            key: loc.id,
            checked: base.kind === 'saved' && base.id === loc.id,
            icon: <LocationIcon kind="saved" label={loc.label} size={18} />,
            label: loc.label,
            sub: loc.address,
            select: () => selectSaved(loc.id),
            editLabel: `${loc.label} 편집`,
            onEdit: () => onEdit(loc.id),
        })),
        ...(active.type === 'temp'
            ? [
                  {
                      key: 'temp',
                      checked: base.kind === 'temp',
                      icon: <PinIcon size={18} />,
                      label: active.label,
                      sub: '이번만 쓰는 위치',
                      select: () => {},
                  },
              ]
            : []),
        {
            key: 'default',
            checked: base.kind === 'default',
            icon: <LandmarkIcon size={18} />,
            label: DEFAULT_BASE.label,
            sub: '기본 위치',
            select: selectDefault,
        },
    ];

    const searching = query.trim() !== '';

    return (
        <>
            <div className={styles.head}>
                <h2 id={titleId} tabIndex={-1} className={styles.title}>
                    어디를 기준으로 찾을까요?
                </h2>
                <button type="button" onClick={onClose} aria-label="닫기" className={styles.iconButton}>
                    <CloseIcon size={20} />
                </button>
            </div>

            <form role="search" onSubmit={onSubmit} className={styles.searchForm}>
                <label htmlFor={`${titleId}-q`} className="sr-only">
                    장소 검색
                </label>
                <div className={styles.searchBar}>
                    <SearchIcon size={18} />
                    <input
                        ref={searchRef}
                        id={`${titleId}-q`}
                        type="search"
                        value={query}
                        onChange={onChange}
                        placeholder="동, 구, 역 이름으로 찾기"
                        enterKeyHint="search"
                        autoComplete="off"
                        className={styles.searchInput}
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={clearQuery}
                            aria-label="검색어 지우기"
                            className={styles.clearButton}
                        >
                            <span className={styles.clearDot}>
                                <CloseIcon size={14} strokeWidth={2.6} />
                            </span>
                        </button>
                    )}
                </div>
            </form>

            {error && (
                <p role="alert" className={styles.error}>
                    {error}
                </p>
            )}

            <div className={styles.body}>
                {searching ? (
                    <PlaceResults
                        query={query.trim()}
                        search={search}
                        onRetry={() => runSearch(query)}
                        onPick={onPick}
                    />
                ) : (
                    <>
                        <div className={styles.sectionHead}>
                            <h3 className={styles.sectionTitle}>저장한 위치</h3>
                            <span className={styles.count}>{`${saved.length} / ${MAX_SAVED}`}</span>
                        </div>
                        {saved.length === 0 && (
                            <p className={styles.hint}>자주 가는 곳을 저장해 두면 여기서 바로 고를 수 있어요.</p>
                        )}

                        <RadioGroup options={options} onChoose={choose} />

                        <button
                            type="button"
                            onClick={() => searchRef.current?.focus()}
                            className={styles.addButton}
                        >
                            <span className={styles.addIcon}>
                                <PlusIcon size={18} strokeWidth={2.2} />
                            </span>
                            새 위치 추가
                        </button>
                    </>
                )}
            </div>

            <p className={styles.footnote}>
                저장한 위치는 이 기기에만 남고, 고른 위치 하나만 주변 도서관을 찾는 데 써요.
            </p>
        </>
    );
}

/*
 * 라디오 묶음. 화살표로 옮기면(포커스 + 선택) 창은 열어 두고, 클릭·Enter·Space면 고르고 닫는다.
 * Tab으로는 선택된 항목 하나에만 들어온다 (roving tabindex).
 */
function RadioGroup({ options, onChoose }) {
    const groupRef = useRef(null);

    function onKeyDown(e) {
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (!step && e.key !== 'Home' && e.key !== 'End') return;

        const radios = [...groupRef.current.querySelectorAll('[role="radio"]')];
        const current = radios.indexOf(document.activeElement);
        if (current === -1) return;
        e.preventDefault();

        const next =
            e.key === 'Home'
                ? 0
                : e.key === 'End'
                  ? radios.length - 1
                  : (current + step + radios.length) % radios.length;
        radios[next].focus();
        onChoose(options[next].select, { keepOpen: true });
    }

    return (
        <div ref={groupRef} role="radiogroup" aria-label="기준 위치" onKeyDown={onKeyDown} className={styles.options}>
            {options.map((option) => (
                <div key={option.key} className={styles.option} data-checked={option.checked || undefined}>
                    <button
                        type="button"
                        role="radio"
                        aria-checked={option.checked}
                        tabIndex={option.checked ? 0 : -1}
                        onClick={() => onChoose(option.select)}
                        className={styles.optionButton}
                    >
                        <span className={styles.radio} aria-hidden="true" />
                        <span className={styles.optionIcon}>{option.icon}</span>
                        <span className={styles.optionText}>
                            <span className={styles.optionLabel}>{option.label}</span>
                            <span className={styles.optionSub}>{option.sub}</span>
                        </span>
                    </button>
                    {option.onEdit && (
                        <button
                            type="button"
                            onClick={option.onEdit}
                            aria-label={option.editLabel}
                            className={styles.iconButton}
                        >
                            <EditIcon size={18} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}

function PlaceResults({ query, search, onRetry, onPick }) {
    if (search.status === 'error') {
        return (
            <div className={styles.notice}>
                <p role="alert" className={styles.noticeText}>
                    장소를 찾지 못했어요.
                </p>
                <button type="button" onClick={onRetry} className={styles.secondary}>
                    다시 시도
                </button>
            </div>
        );
    }

    // 첫 결과가 오기 전에는 자리만 (이전 결과가 있으면 그대로 두고 바꿔 끼움)
    if (search.status !== 'done' && search.places.length === 0) {
        return (
            <ul className={styles.results} aria-hidden="true">
                {[0, 1, 2].map((i) => (
                    <li key={i} className={styles.resultSkeleton} />
                ))}
            </ul>
        );
    }

    if (search.status === 'done' && search.places.length === 0) {
        return (
            <p role="status" className={styles.hint}>
                {`‘${query}’에 맞는 곳이 없어요. 동, 구, 역 이름으로 찾아 보세요.`}
            </p>
        );
    }

    return (
        <ul className={styles.results} aria-busy={search.status === 'loading'}>
            {search.places.map((place) => (
                <li key={`${place.name}:${place.address}`}>
                    <button type="button" onClick={() => onPick(place)} className={styles.result}>
                        <span className={styles.optionIcon}>
                            <PinIcon size={18} />
                        </span>
                        <span className={styles.optionText}>
                            <span className={styles.optionLabel}>{place.name}</span>
                            <span className={styles.optionSub}>{place.address}</span>
                        </span>
                    </button>
                </li>
            ))}
        </ul>
    );
}

/* ---------------- save / edit ---------------- */

function SaveView({ titleId, place, full, onBack, onClose }) {
    const [label, setLabel] = useState('');
    const [activate, setActivate] = useState(true);
    const [error, setError] = useState('');

    function onSubmit(e) {
        e.preventDefault();
        try {
            saveLocation(place, label, { activate });
            if (activate) onClose();
            else onBack();
        } catch {
            setError(STORAGE_ERROR);
        }
    }

    function chooseOnce() {
        try {
            selectTemp(place);
            onClose();
        } catch {
            setError(STORAGE_ERROR);
        }
    }

    return (
        <SubView titleId={titleId} title="이 위치 저장하기" onBack={onBack}>
            <PlaceSummary
                title={place.name}
                address={place.address}
                caption="정확한 주소 대신 동 단위로 저장해요."
            />

            {full ? (
                <div className={styles.formBody}>
                    <p className={styles.notice}>
                        <span className={styles.noticeText}>
                            {`저장한 위치는 ${MAX_SAVED}개까지예요. 안 쓰는 위치를 지우면 더 저장할 수 있어요.`}
                        </span>
                    </p>
                    {error && (
                        <p role="alert" className={styles.error}>
                            {error}
                        </p>
                    )}
                    <div className={styles.footer}>
                        <button type="button" onClick={chooseOnce} className={styles.primary}>
                            이번만 이 위치 쓰기
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={onSubmit} className={styles.formBody}>
                    <LabelField
                        id={`${titleId}-name`}
                        value={label}
                        onChange={setLabel}
                        placeholder={place.name}
                    />
                    <label className={styles.check}>
                        <input
                            type="checkbox"
                            checked={activate}
                            onChange={(e) => setActivate(e.target.checked)}
                        />
                        저장하고 바로 이 위치 기준으로 보기
                    </label>
                    {error && (
                        <p role="alert" className={styles.error}>
                            {error}
                        </p>
                    )}
                    <div className={styles.footer}>
                        <button type="submit" className={styles.primary}>
                            저장
                        </button>
                        <button type="button" onClick={chooseOnce} className={styles.textButton}>
                            저장하지 않고 이번만 쓰기
                        </button>
                    </div>
                </form>
            )}
        </SubView>
    );
}

function EditView({ titleId, location, onBack }) {
    const [label, setLabel] = useState(location?.label ?? '');
    const [error, setError] = useState('');

    // 다른 탭에서 지워진 경우
    if (!location) {
        return (
            <SubView titleId={titleId} title="위치 편집" onBack={onBack}>
                <p className={styles.hint}>이 위치는 이미 지워졌어요.</p>
            </SubView>
        );
    }

    function run(action) {
        try {
            action();
            onBack();
        } catch {
            setError(STORAGE_ERROR);
        }
    }

    return (
        <SubView titleId={titleId} title="위치 편집" onBack={onBack}>
            <PlaceSummary
                title={location.address}
                caption="위치를 옮기려면 이 위치를 지우고 새로 추가해요."
            />
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    run(() => renameLocation(location.id, label));
                }}
                className={styles.formBody}
            >
                <LabelField id={`${titleId}-name`} value={label} onChange={setLabel} placeholder={location.label} />
                {error && (
                    <p role="alert" className={styles.error}>
                        {error}
                    </p>
                )}
                <div className={styles.footer}>
                    <button type="submit" className={styles.primary}>
                        저장
                    </button>
                    <button
                        type="button"
                        onClick={() => run(() => removeLocation(location.id))}
                        className={`${styles.textButton} ${styles.danger}`}
                    >
                        이 위치 삭제
                    </button>
                </div>
            </form>
        </SubView>
    );
}

// 저장·편집 화면의 머리: 뒤로 + 제목. 들어오면 제목으로 포커스를 옮겨 화면이 바뀐 걸 알림
function SubView({ titleId, title, onBack, children }) {
    const headingRef = useRef(null);
    useEffect(() => headingRef.current?.focus(), []);

    return (
        <>
            <div className={styles.subHead}>
                <button type="button" onClick={onBack} aria-label="뒤로" className={styles.iconButton}>
                    <BackIcon size={24} />
                </button>
                <h2 ref={headingRef} id={titleId} tabIndex={-1} className={styles.title}>
                    {title}
                </h2>
            </div>
            <div className={styles.body}>{children}</div>
        </>
    );
}

function PlaceSummary({ title, address, caption }) {
    return (
        <div className={styles.summary}>
            <p className={styles.summaryTitle}>{title}</p>
            {address && address !== title && <p className={styles.summaryAddress}>{address}</p>}
            <p className={styles.summaryCaption}>{caption}</p>
        </div>
    );
}

// 이름 입력 + 글자 수 + 지우기 + 빠른 이름 칩. 비워 두면 placeholder(장소 이름)로 저장
function LabelField({ id, value, onChange, placeholder }) {
    const inputRef = useRef(null);
    const counterId = `${id}-count`;

    return (
        <div className={styles.field}>
            <label htmlFor={id} className={styles.fieldLabel}>
                이름
            </label>
            <div className={styles.inputBox}>
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    maxLength={BASE_LABEL_MAX}
                    placeholder={placeholder}
                    autoComplete="off"
                    aria-describedby={counterId}
                    className={styles.input}
                />
                <span id={counterId} className={styles.counter}>
                    {`${value.length}/${BASE_LABEL_MAX}`}
                </span>
                {value && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange('');
                            inputRef.current?.focus();
                        }}
                        aria-label="이름 지우기"
                        className={styles.clearButton}
                    >
                        <span className={styles.clearDot}>
                            <CloseIcon size={14} strokeWidth={2.6} />
                        </span>
                    </button>
                )}
            </div>
            <div role="group" aria-label="이름 빠르게 고르기" className={styles.quick}>
                {QUICK_LABELS.map((quick) => (
                    <button
                        key={quick}
                        type="button"
                        aria-pressed={value === quick}
                        onClick={() => onChange(quick)}
                        className={styles.quickChip}
                    >
                        {quick}
                    </button>
                ))}
            </div>
        </div>
    );
}
