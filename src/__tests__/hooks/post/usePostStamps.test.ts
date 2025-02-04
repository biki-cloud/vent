import { renderHook } from "@testing-library/react";
import { usePostStamps } from "~/hooks/post/usePostStamps";
import { TestWrapper } from "src/__tests__/utils/test-utils";

jest.mock("src/utils/api", () => {
  const mockAddStampMutation = jest.fn();
  const mockInvalidate = jest.fn();
  const mockSetInfiniteData = jest.fn();

  return {
    api: {
      post: {
        addStamp: {
          useMutation: () => ({
            mutate: mockAddStampMutation,
            isLoading: false,
          }),
        },
        getClientId: {
          useQuery: () => ({
            data: "test-client-id",
          }),
        },
      },
      useContext: () => ({
        invalidate: mockInvalidate,
        post: {
          getById: {
            setInfiniteData: mockSetInfiniteData,
          },
        },
      }),
    },
  };
});

describe("usePostStamps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("スタンプをクリックしたときにmutateが呼ばれること", () => {
    const { result } = renderHook(() => usePostStamps(), {
      wrapper: TestWrapper,
    });

    result.current.handleStampClick("1", "😊");

    // モックの呼び出しを検証
    const mockApi = jest.requireMock("src/utils/api").api;
    expect(mockApi.post.addStamp.useMutation().mutate).toHaveBeenCalledWith({
      postId: "1",
      type: "😊",
      native: "😊",
    });
  });
});
