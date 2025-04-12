import { render, screen, fireEvent } from "@testing-library/react";
import { PostList } from "~/components/post/PostList";
import { api } from "~/utils/api";
import { renderWithProviders } from "~/utils/test-utils";
import { Filter, SortDesc, SortAsc, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";

jest.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  SortDesc: () => <div data-testid="sort-desc-icon" />,
  SortAsc: () => <div data-testid="sort-asc-icon" />,
  RotateCw: () => <div data-testid="rotate-cw-icon" />,
  Smile: () => <div data-testid="smile-icon" />,
}));

jest.mock("@emoji-mart/react", () => ({
  __esModule: true,
  default: ({ onEmojiSelect }: { onEmojiSelect: (emoji: any) => void }) => {
    const handleClick = () => {
      onEmojiSelect({
        native: "😊",
      });
    };
    return <div data-testid="emoji-picker" onClick={handleClick} />;
  },
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));

jest.mock("~/utils/api", () => ({
  api: {
    useContext: jest.fn(),
    post: {
      getAll: {
        useInfiniteQuery: jest.fn(),
      },
      delete: {
        useMutation: jest.fn(),
      },
      addStamp: {
        useMutation: jest.fn(),
      },
      getClientId: {
        useQuery: jest.fn(),
      },
    },
    emotionTag: {
      getAll: {
        useQuery: jest.fn(),
      },
    },
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe("PostList", () => {
  const mockPosts = [
    {
      id: "1",
      content: "Test content",
      createdAt: new Date("2025-01-26T08:03:24.000Z"),
      anonymousId: "anonymous-1",
      emotionTag: {
        id: "clh1234567890",
        name: "happy",
      },
      stamps: [],
    },
  ];

  const mockEmotionTags = [
    {
      id: "clh1234567890",
      name: "怒り",
      emoji: "😠",
    },
    {
      id: "clh1234567891",
      name: "楽しい",
      emoji: "🎉",
    },
  ];

  const mockMutate = jest.fn();
  const mockDeleteMutate = jest.fn();

  beforeEach(() => {
    (api.post.getAll.useInfiniteQuery as jest.Mock).mockReturnValue({
      data: {
        pages: [
          {
            items: mockPosts,
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    (api.emotionTag.getAll.useQuery as jest.Mock).mockReturnValue({
      data: mockEmotionTags,
    });

    (api.post.delete.useMutation as jest.Mock).mockReturnValue({
      mutate: mockDeleteMutate,
    });

    (api.post.addStamp.useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
    });

    (api.post.getClientId.useQuery as jest.Mock).mockReturnValue({
      data: "anonymous-1",
    });

    (api.useContext as jest.Mock).mockReturnValue({
      post: {
        getAll: {
          setData: jest.fn(),
        },
      },
    });
  });

  it("投稿が表示されること", () => {
    renderWithProviders(<PostList />);
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("感情タグでフィルタリングできること", () => {
    renderWithProviders(<PostList />);
    const select = screen.getByLabelText("すべての感情");
    fireEvent.change(select, { target: { value: "clh1234567890" } });
    expect(select).toHaveValue("clh1234567890");
  });

  it("投稿の順序を変更できること", () => {
    renderWithProviders(<PostList />);
    const select = screen.getByLabelText("新しい順");
    fireEvent.change(select, { target: { value: "asc" } });
    expect(select).toHaveValue("asc");
  });

  it("自分の投稿を削除できること", () => {
    const mockPostsWithOwnPost = [
      {
        ...mockPosts[0],
        anonymousId: "anonymous-1",
      },
    ];

    (api.post.getAll.useInfiniteQuery as jest.Mock).mockReturnValue({
      data: {
        pages: [
          {
            items: mockPostsWithOwnPost,
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    renderWithProviders(<PostList />);
    const deleteButton = screen.getByTestId("trash-icon");
    fireEvent.click(deleteButton);
  });

  it("スタンプを追加できること", () => {
    renderWithProviders(<PostList />);
    const stampButton = screen.getByTestId("smile-icon");
    fireEvent.click(stampButton);

    // emoji-pickerのonEmojiSelectをシミュレート
    const emojiPicker = screen.getByTestId("emoji-picker");
    fireEvent.click(emojiPicker);

    expect(mockMutate).toHaveBeenCalledWith({
      postId: "1",
      type: "😊",
      native: "😊",
    });
  });

  it("ローディング中はスピナーが表示されること", () => {
    (api.post.getAll.useInfiniteQuery as jest.Mock).mockReturnValue({
      data: {
        pages: [],
      },
      isLoading: true,
      refetch: jest.fn(),
    });

    renderWithProviders(<PostList />);
    expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
  });

  it("投稿がない場合はメッセージが表示されること", () => {
    (api.post.getAll.useInfiniteQuery as jest.Mock).mockReturnValue({
      data: {
        pages: [],
      },
      isLoading: false,
      refetch: jest.fn(),
    });

    renderWithProviders(<PostList />);
    expect(screen.getByText("投稿がありません")).toBeInTheDocument();
  });
});
