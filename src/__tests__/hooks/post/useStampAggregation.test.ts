import { renderHook } from "@testing-library/react";
import { useStampAggregation } from "~/hooks/post/useStampAggregation";
import type { ClientStamp } from "~/types/stamps";

describe("useStampAggregation", () => {
  const mockStamps: ClientStamp[] = [
    {
      id: "1",
      type: "happy",
      native: "😊",
      anonymousId: "user1",
    },
    {
      id: "2",
      type: "happy",
      native: "😊",
      anonymousId: "user2",
    },
    {
      id: "3",
      type: "sad",
      native: "😢",
      anonymousId: "user1",
    },
  ];

  it("スタンプを正しく集計すること", () => {
    const { result } = renderHook(() => useStampAggregation(mockStamps));

    expect(result.current.aggregatedStamps).toHaveLength(2);
    expect(result.current.aggregatedStamps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "happy",
          count: 2,
          stamps: expect.arrayContaining([
            expect.objectContaining({ id: "1" }),
            expect.objectContaining({ id: "2" }),
          ]),
        }),
        expect.objectContaining({
          type: "sad",
          count: 1,
          stamps: expect.arrayContaining([
            expect.objectContaining({ id: "3" }),
          ]),
        }),
      ]),
    );
  });

  it("空の配列が渡された場合、空の集計結果を返すこと", () => {
    const { result } = renderHook(() => useStampAggregation([]));

    expect(result.current.aggregatedStamps).toHaveLength(0);
  });
});
