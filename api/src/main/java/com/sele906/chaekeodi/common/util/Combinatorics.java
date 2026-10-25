package com.sele906.chaekeodi.common.util;

import java.util.ArrayList;
import java.util.List;

public final class Combinatorics {

    private Combinatorics() {
        // 객체 생성 방지
    }

    // 조합: 어느 도서관을 방문할지 선택
    public static <T> List<List<T>> combinations(List<T> items, int k) {
        List<List<T>> result = new ArrayList<>();
        pick(items, k, 0, new ArrayList<>(), result);
        return result;
    }

    private static <T> void pick(List<T> items, int k, int start,
                                 List<T> current, List<List<T>> result) {
        if (current.size() == k) {
            result.add(new ArrayList<>(current));
            return;
        }

        for (int i = start; i < items.size(); i++) {
            current.add(items.get(i));
            pick(items, k, i + 1, current, result);
            current.remove(current.size() - 1);
        }
    }

    // 순열: 도서관 방문 순서 결정
    public static <T> List<List<T>> permutations(List<T> items) {
        if (items.size() <= 1) {
            return List.of(new ArrayList<>(items));
        }

        List<List<T>> result = new ArrayList<>();

        for (int i = 0; i < items.size(); i++) {
            List<T> rest = new ArrayList<>(items);
            T first = rest.remove(i);

            for (List<T> tail : permutations(rest)) {
                List<T> order = new ArrayList<>();
                order.add(first);
                order.addAll(tail);
                result.add(order);
            }
        }

        return result;
    }
}
