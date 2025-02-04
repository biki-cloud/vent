"use client";

import { type Post, type Stamp, type EmotionTag } from "@prisma/client";
import { Card, CardContent, CardHeader } from "./ui/card";
import { StampSelector } from "./post/StampSelector";
import { DeletePostDialog } from "./post/DeletePostDialog";
import { formatDate } from "~/lib/utils";
import { api } from "~/utils/api";

interface PostDetailProps {
  post: Post & {
    stamps: Stamp[];
    emotionTag: EmotionTag;
  };
}

export function PostDetail({ post }: PostDetailProps) {
  const { data: updatedPost } = api.post.getById.useQuery(
    { id: post.id },
    {
      initialData: post,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  );

  if (!updatedPost) return null;

  return (
    <div className="space-y-4">
      <Card className="mx-auto w-full">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              {formatDate(updatedPost.createdAt)}
            </div>
          </div>
          <DeletePostDialog postId={updatedPost.id} />
        </CardHeader>
        <CardContent className="pt-6">
          <p className="whitespace-pre-wrap break-words text-lg leading-relaxed">
            {updatedPost.content}
          </p>
          <div className="mt-6 border-t pt-6">
            <StampSelector
              postId={updatedPost.id}
              stamps={updatedPost.stamps}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
