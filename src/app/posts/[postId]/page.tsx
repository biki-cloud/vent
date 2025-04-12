import { api } from "~/trpc/server";
import { notFound } from "next/navigation";
import { PostDetail } from "~/components/PostDetail";
import { TRPCProvider } from "~/app/providers";

interface Props {
  params: {
    postId: string;
  };
}

export default async function PostPage({ params }: Props) {
  const { postId } = params;

  try {
    const post = await api.post.getById({ id: postId });

    if (!post) {
      return notFound();
    }

    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-8 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-center text-4xl font-bold text-transparent">
              投稿詳細
            </h1>
            <TRPCProvider>
              <PostDetail post={post} />
            </TRPCProvider>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.log("error", error);
    return notFound();
  }
}
