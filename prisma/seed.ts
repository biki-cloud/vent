import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  // 感情タグのデータを作成
  const emotionTags = await Promise.all([
    prisma.emotionTag.create({
      data: {
        name: "怒り",
      },
    }),
    prisma.emotionTag.create({
      data: {
        name: "悲しみ",
      },
    }),
    prisma.emotionTag.create({
      data: {
        name: "不安",
      },
    }),
    prisma.emotionTag.create({
      data: {
        name: "喜び",
      },
    }),
    prisma.emotionTag.create({
      data: {
        name: "落ち込み",
      },
    }),
    prisma.emotionTag.create({
      data: {
        name: "楽しい",
      },
    }),
  ]);

  // 投稿データを作成
  await Promise.all([
    prisma.post.create({
      data: {
        content: "今日は晴れて気持ちがいい一日でした！",
        emotionTagId: emotionTags[0].id, // 嬉しい
        anonymousId: uuidv4(),
      },
    }),
    prisma.post.create({
      data: {
        content: "友達と遊園地に行って楽しかった！",
        emotionTagId: emotionTags[1].id, // 楽しい
        anonymousId: uuidv4(),
      },
    }),
    prisma.post.create({
      data: {
        content: "大切なものをなくしてしまった...",
        emotionTagId: emotionTags[2].id, // 悲しい
        anonymousId: uuidv4(),
      },
    }),
  ]);

  console.log("シードデータの作成が完了しました");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
