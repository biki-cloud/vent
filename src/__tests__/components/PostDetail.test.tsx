import { screen } from "@testing-library/react";
import { PostDetail } from "~/components/PostDetail";
import { renderWithProviders } from "~/utils/test-utils";
import { type Post, type Stamp, type EmotionTag } from "@prisma/client";

describe("PostDetail", () => {
  const mockPost: Post & { stamps: Stamp[]; emotionTag: EmotionTag } = {
    id: "1",
    content: "Test post content",
    createdAt: new Date("2024-02-01T00:00:00.000Z"),
    emotionTagId: "1",
    anonymousId: "test-anonymous-id",
    emotionTag: {
      id: "1",
      name: "happy",
    },
    stamps: [
      {
        id: "1",
        postId: "1",
        type: "👍",
        native: "👍",
        anonymousId: "test-anonymous-id",
        createdAt: new Date("2024-02-01T00:00:00.000Z"),
      },
    ],
  };

  it("投稿の内容が表示されること", () => {
    renderWithProviders(<PostDetail post={mockPost} />);
    expect(screen.getByText("Test post content")).toBeInTheDocument();
  });

  it("投稿の日時が表示されること", () => {
    renderWithProviders(<PostDetail post={mockPost} />);
    expect(screen.getByText("2024/2/1 09:00")).toBeInTheDocument();
  });

  it("スタンプが表示されること", () => {
    renderWithProviders(<PostDetail post={mockPost} />);
    expect(screen.getByText("👍")).toBeInTheDocument();
  });
});
