"use client";

import { useCallback } from "react";
import { api } from "~/utils/api";
import { useClientId } from "~/hooks/useClientId";
import type { RouterOutputs } from "~/utils/api";
import type { InfiniteData } from "@tanstack/react-query";

type PostResponse = RouterOutputs["post"]["getAll"];
type Stamp = {
  id: string;
  type: string;
  native: string;
  anonymousId: string;
  postId: string;
  createdAt: Date;
};

interface StampInput {
  postId: string;
  type: string;
  native: string;
}

interface StampMutationContext {
  previousPosts: InfiniteData<PostResponse> | undefined;
  previousPost: RouterOutputs["post"]["getById"] | undefined;
}

interface StampMutationError {
  message: string;
}

interface StampMutationOptions {
  onMutate?: (variables: StampInput) => Promise<StampMutationContext>;
  onError?: (
    error: StampMutationError,
    variables: StampInput,
    context: StampMutationContext,
  ) => void;
  onSettled?: () => void;
}

export function usePostStamps(
  emotionTagId?: string,
  orderBy: "asc" | "desc" = "desc",
  _: StampMutationOptions = {},
) {
  const { clientId } = useClientId();
  const utils = api.useContext();

  const { mutate: addStamp } = api.post.addStamp.useMutation({
    async onMutate(variables: StampInput) {
      console.log("🚀 onMutate called with variables:", variables);

      // キャッシュの更新を一時停止
      await utils.post.getAll.cancel();
      await utils.post.getById.cancel();

      // 現在のデータを保存
      const previousPosts = utils.post.getAll.getInfiniteData({
        limit: 10,
        emotionTagId,
        orderBy,
      });
      const previousPost = utils.post.getById.getData({ id: variables.postId });

      console.log("📦 Previous posts state:", previousPosts);

      // 投稿一覧のキャッシュを更新
      utils.post.getAll.setInfiniteData(
        { limit: 10, emotionTagId, orderBy },
        (old) => {
          if (!old) return { pages: [], pageParams: [] };
          console.log("🔄 Updating infinite data");
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((post) => {
                if (post.id !== variables.postId) return post;
                console.log("🎯 Updating post with ID:", post.id);

                const existingStamp = post.stamps.find(
                  (s) =>
                    s.type === variables.type && s.anonymousId === clientId,
                );

                if (existingStamp) {
                  console.log("🗑️ Removing existing stamp:", existingStamp);
                  return {
                    ...post,
                    stamps: post.stamps.filter(
                      (s) => s.id !== existingStamp.id,
                    ),
                  };
                }

                console.log("➕ Adding new stamp");
                return {
                  ...post,
                  stamps: [
                    ...post.stamps,
                    {
                      id: `temp-${Date.now()}`,
                      type: variables.type,
                      anonymousId: clientId,
                      postId: variables.postId,
                      createdAt: new Date(),
                      native: variables.native,
                    } as Stamp,
                  ],
                };
              }),
            })),
          };
        },
      );

      // 投稿詳細のキャッシュを更新
      utils.post.getById.setData({ id: variables.postId }, (old) => {
        if (!old) return old;

        const existingStamp = old.stamps.find(
          (s) => s.type === variables.type && s.anonymousId === clientId,
        );

        if (existingStamp) {
          return {
            ...old,
            stamps: old.stamps.filter((s) => s.id !== existingStamp.id),
          };
        }

        return {
          ...old,
          stamps: [
            ...old.stamps,
            {
              id: `temp-${Date.now()}`,
              type: variables.type,
              anonymousId: clientId,
              postId: variables.postId,
              createdAt: new Date(),
              native: variables.native,
            } as Stamp,
          ],
        };
      });

      return { previousPosts, previousPost };
    },

    onError(error, variables, context) {
      console.error("❌ Error occurred:", error);
      console.log("🔄 Rolling back to previous state");

      // 投稿一覧を元に戻す
      if (context?.previousPosts) {
        utils.post.getAll.setInfiniteData(
          { limit: 10, emotionTagId, orderBy },
          () => ({
            pages: context.previousPosts?.pages ?? [],
            pageParams: context.previousPosts?.pageParams ?? [],
          }),
        );
      }

      // 投稿詳細を元に戻す
      if (context?.previousPost) {
        utils.post.getById.setData(
          { id: variables.postId },
          context.previousPost,
        );
      }
    },

    onSuccess(data, variables) {
      console.log("✅ Mutation succeeded:", { data, variables });
    },

    onSettled() {
      // キャッシュを再検証
      void utils.post.getAll.invalidate();
      void utils.post.getById.invalidate();
    },
  });

  const handleStampClick = useCallback(
    (postId: string, type: string, native?: string) => {
      console.log("👆 Stamp clicked:", { postId, type, native });
      if (!clientId) {
        console.warn("⚠️ No clientId available");
        return;
      }
      const input: StampInput = {
        postId,
        type,
        native: native ?? type,
      };
      addStamp(input);
    },
    [addStamp, clientId],
  );

  return {
    handleStampClick,
    clientId,
  };
}
