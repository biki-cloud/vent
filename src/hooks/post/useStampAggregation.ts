import { useMemo, useCallback } from "react";
import type { Stamp, AggregatedStamp } from "~/types/stamps";

type StampAggregationMap = Record<string, AggregatedStamp>;

/**
 * スタンプを集計するカスタムフック
 * @param stamps - 集計対象のスタンプ配列
 * @returns 集計結果を含むオブジェクト
 */
export function useStampAggregation(stamps: Stamp[]) {
  // スタンプを集計する関数
  const aggregateStamps = useCallback(
    (inputStamps: Stamp[]): AggregatedStamp[] => {
      try {
        if (!Array.isArray(inputStamps)) {
          console.error("Error aggregating stamps: Input must be an array");
          return [];
        }

        const stampMap = inputStamps.reduce<StampAggregationMap>(
          (acc, stamp) => {
            const type = stamp.type;
            acc[type] ??= {
              type,
              count: 0,
              stamps: [],
            };
            acc[type].count += 1;
            acc[type].stamps.push(stamp);
            return acc;
          },
          {},
        );

        return Object.values(stampMap);
      } catch (error) {
        console.error("Error aggregating stamps:", error);
        return [];
      }
    },
    [],
  );

  // メモ化された集計結果
  const aggregatedStamps = useMemo(
    () => aggregateStamps(stamps),
    [stamps, aggregateStamps],
  );

  return {
    aggregatedStamps,
  };
}
