import { render } from "@testing-library/react";
import { mockApi } from "src/__tests__/utils/test-utils";
import PostPage from "~/app/posts/[postId]/page";

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  cache: <T extends (...args: unknown[]) => unknown>(fn: T): T => fn,
}));

const mockNotFound = jest.fn();

jest.mock("next/navigation", () => ({
  notFound: () => {
    mockNotFound();
    return { notFound: true };
  },
}));

jest.mock("next/headers", () => ({
  headers: () => new Map(),
}));

jest.mock("~/utils/api", () => ({
  api: mockApi,
}));

const mockPost = {
  id: "1",
  message: "test message",
  emotionTags: [],
  stamps: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("PostPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.skip("投稿が表示されること", async () => {
    mockApi.post.getById.mockResolvedValue(mockPost);

    const props = {
      params: {
        postId: "1",
      },
    };

    const page = await PostPage(props);
    const { container } = render(page);

    expect(container).toBeInTheDocument();
    expect(mockApi.post.getById).toHaveBeenCalledWith({ id: "1" });
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it.skip("投稿が見つからない場合はnotFoundを呼び出すこと", async () => {
    mockApi.post.getById.mockResolvedValue(null);

    const props = {
      params: {
        postId: "1",
      },
    };

    const result = await PostPage(props);
    expect(result).toEqual({ notFound: true });
    expect(mockNotFound).toHaveBeenCalled();
  });

  it.skip("エラーが発生した場合はnotFoundを呼び出すこと", async () => {
    mockApi.post.getById.mockRejectedValue(new Error("API Error"));

    const props = {
      params: {
        postId: "1",
      },
    };

    const result = await PostPage(props);
    expect(result).toEqual({ notFound: true });
    expect(mockNotFound).toHaveBeenCalled();
  });
});
