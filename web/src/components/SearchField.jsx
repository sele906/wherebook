'use client';

import { useRef, useState } from 'react';

import { CloseIcon } from './icons';
import styles from './SearchField.module.css';

/*
 * 검색 입력창 + 지우기(✕) 버튼. 지우기 버튼이 값이 있을 때만 보여야 해서 클라이언트로 뗐다.
 * 제출은 감싸는 <form method="get">이 맡으므로 JS가 없어도 검색은 된다.
 * 검색어가 바뀌어 다시 그릴 때는 쓰는 쪽에서 key를 바꿔 초기값을 다시 받게 한다.
 */
export default function SearchField({ id, name, label, defaultValue = '', placeholder }) {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef(null);

    function clear() {
        setValue('');
        inputRef.current?.focus();
    }

    return (
        <div className={styles.field}>
            <label htmlFor={id} className="sr-only">
                {label}
            </label>
            <input
                ref={inputRef}
                id={id}
                name={name}
                type="search"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                enterKeyHint="search"
                autoComplete="off"
                required
                className={styles.input}
            />
            {value && (
                <button type="button" onClick={clear} className={styles.clear} aria-label="검색어 지우기">
                    <span className={styles.clearDot}>
                        <CloseIcon size={14} strokeWidth={2.6} />
                    </span>
                </button>
            )}
        </div>
    );
}
