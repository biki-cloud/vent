# PWA設定ガイド

このドキュメントでは、Next.jsプロジェクトでPWA（Progressive Web App）を設定する方法について説明します。

## 必要なパッケージ

```bash
pnpm add next-pwa@5.6.0
pnpm add -D @types/next-pwa@5.6.9
pnpm add web-push@3.6.7
pnpm add -D @types/web-push@3.6.4
```

## 環境変数の設定

`.env`ファイルに以下の環境変数を設定します：

```env
VAPID_PRIVATE_KEY=your_private_key
VAPID_EMAIL=your_email@example.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
```

VAPIDキーは以下のコマンドで生成できます：

```bash
npx web-push generate-vapid-keys
```

## 必要なファイル

### 1. next.config.js

```javascript
import nextPWA from "next-pwa";

const withPWA = nextPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import("next").NextConfig} */
const config = {
  // ... 他の設定
};

export default withPWA(config);
```

### 2. public/manifest.json

```json
{
  "name": "Your App Name",
  "short_name": "Short Name",
  "description": "Your app description",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4F46E5",
  "icons": [
    {
      "src": "/icon512_maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon512_rounded.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ],
  "orientation": "portrait",
  "scope": "/",
  "prefer_related_applications": false,
  "permissions": ["notifications", "push"],
  "gcm_sender_id": "103953800507"
}
```

### 3. public/service-worker.js

```javascript
// プッシュ通知を受信したときの処理
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icon512_rounded.png",
      badge: "/icon512_maskable.png",
      data: {
        url: data.url,
      },
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (error) {
    console.error("Push通知処理エラー:", error);
  }
});

// 通知がクリックされたときの処理
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
```

### 4. src/components/ServiceWorkerRegistration.tsx

```typescript
"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  return null;
}
```

### 5. app/layout.tsxの設定

```typescript
import { ServiceWorkerRegistration } from "../components/ServiceWorkerRegistration";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon512_rounded.png"></link>
        <meta name="theme-color" content="#4F46E5" />
      </head>
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
```

## .gitignoreの設定

以下のファイルをgitignoreに追加します：

```gitignore
# next-pwa
**/public/sw.js
**/public/sw.js.map
**/public/workbox-*.js
**/public/workbox-*.js.map
```

## プッシュ通知の実装

プッシュ通知を実装する場合は、以下のコンポーネントとAPIエンドポイントが必要です：

### NotificationButton.tsx

プッシュ通知の購読を管理するコンポーネントを実装します。主な機能：

- 通知の許可状態の確認
- プッシュ通知の購読/解除
- 購読情報のローカルストレージ保存

```typescript
"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { env } from "~/env";
import { useToast } from "~/hooks/use-toast";
import { Bell, BellRing, Send } from "lucide-react";
import { api } from "~/trpc/react";

const PUSH_NOTIFICATION_STORAGE_KEY = "push-notification-status";
const PUSH_SUBSCRIPTION_STORAGE_KEY = "push-subscription";

export function NotificationButton() {
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // tRPCミューテーション - 購読情報の保存
  const { mutate: savePushSubscription } =
    api.notification.savePushSubscription.useMutation({
      onSuccess: () => {
        console.log("Push通知の購読情報を保存しました");
      },
      onError: (error) => {
        console.error("Push通知の購読情報の保存に失敗しました:", error);
        toast({
          title: "エラー",
          description: "通知の設定に失敗しました",
          variant: "destructive",
        });
      },
    });

  // tRPCミューテーション - 購読情報の削除
  const { mutate: deletePushSubscription } =
    api.notification.deletePushSubscription.useMutation({
      onSuccess: () => {
        console.log("Push通知の購読情報を削除しました");
      },
      onError: (error) => {
        console.error("Push通知の購読情報の削除に失敗しました:", error);
      },
    });

  // 初期化処理
  useEffect(() => {
    let isMounted = true;

    const initializeNotificationState = async () => {
      if (!isMounted) return;

      try {
        if (!("Notification" in window)) {
          setIsLoading(false);
          return;
        }

        // ローカルストレージから状態を復元
        const storedStatus = localStorage.getItem(PUSH_NOTIFICATION_STORAGE_KEY);
        const storedSubscription = localStorage.getItem(PUSH_SUBSCRIPTION_STORAGE_KEY);

        if (storedStatus === "true" && storedSubscription) {
          const parsedSubscription = JSON.parse(storedSubscription);
          if (parsedSubscription && typeof parsedSubscription === "object" && "endpoint" in parsedSubscription) {
            try {
              const registration = await navigator.serviceWorker.ready;
              const existingSubscription = await registration.pushManager.getSubscription();

              if (existingSubscription) {
                setSubscription(existingSubscription);
                setIsSubscribed(true);
                savePushSubscription({
                  subscription: JSON.stringify(existingSubscription),
                });
              } else {
                const newSubscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
                });
                setSubscription(newSubscription);
                setIsSubscribed(true);
                savePushSubscription({
                  subscription: JSON.stringify(newSubscription),
                });
              }
            } catch (error) {
              console.error("購読の再構築に失敗しました:", error);
              localStorage.removeItem(PUSH_NOTIFICATION_STORAGE_KEY);
              localStorage.removeItem(PUSH_SUBSCRIPTION_STORAGE_KEY);
              setIsSubscribed(false);
              setSubscription(null);
            }
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error("通知の初期化中にエラーが発生しました:", error);
        setIsLoading(false);
      }
    };

    void initializeNotificationState();

    return () => {
      isMounted = false;
    };
  }, [savePushSubscription]);

  // 購読状態の永続化
  useEffect(() => {
    if (isSubscribed && subscription) {
      localStorage.setItem(PUSH_NOTIFICATION_STORAGE_KEY, "true");
      localStorage.setItem(PUSH_SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
    } else {
      localStorage.removeItem(PUSH_NOTIFICATION_STORAGE_KEY);
      localStorage.removeItem(PUSH_SUBSCRIPTION_STORAGE_KEY);
    }
  }, [isSubscribed, subscription]);

  // 購読処理
  const handleSubscribe = async () => {
    try {
      setIsLoading(true);

      if (!("serviceWorker" in navigator) || !navigator.serviceWorker) {
        toast({
          title: "エラー",
          description: "このブラウザはプッシュ通知に対応していません",
          variant: "destructive",
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        toast({
          title: "エラー",
          description: "通知の許可が必要です",
          variant: "destructive",
        });
        return;
      }

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      setSubscription(newSubscription);
      setIsSubscribed(true);
      savePushSubscription({
        subscription: JSON.stringify(newSubscription),
      });

      toast({
        title: "プッシュ通知を設定しました",
        description: "テスト通知を送信できます",
      });
    } catch (error) {
      console.error("プッシュ通知サブスクリプションエラー:", error);
      toast({
        title: "エラー",
        description: "通知の設定に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 購読解除処理
  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true);
      if (subscription) {
        await subscription.unsubscribe();
        deletePushSubscription();
      }
      setSubscription(null);
      setIsSubscribed(false);
      toast({
        title: "通知をオフにしました",
        description: "プッシュ通知は届かなくなります",
      });
    } catch (error) {
      console.error("通知解除エラー:", error);
      toast({
        title: "エラー",
        description: "通知の解除に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // テスト通知送信
  const handleSendNotification = async () => {
    if (!subscription) {
      toast({
        title: "エラー",
        description: "通知の設定が必要です",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSending(true);
      await fetch("/api/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription,
          payload: {
            title: "テスト通知",
            body: "プッシュ通知のテストです",
            url: "/",
          },
        }),
      });
      toast({
        title: "テスト通知を送信しました",
        description: "まもなく通知が届きます",
      });
    } catch (error) {
      console.error("通知送信エラー:", error);
      toast({
        title: "エラー",
        description: "通知の送信に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isSubscribed ? "default" : "outline"}
        size="sm"
        onClick={() => void (isSubscribed ? handleUnsubscribe() : handleSubscribe())}
        disabled={isLoading}
        className="transition-all duration-200"
        aria-label={isSubscribed ? "プッシュ通知を解除" : "プッシュ通知を設定"}
        data-testid="push-notification-subscribe-button"
      >
        {isLoading ? (
          <>
            <Bell className="mr-2 h-4 w-4 animate-pulse" />
            読み込み中
          </>
        ) : isSubscribed ? (
          <>
            <BellRing className="mr-2 h-4 w-4" />
            通知オン
          </>
        ) : (
          <>
            <Bell className="mr-2 h-4 w-4" />
            通知オフ
          </>
        )}
      </Button>
      {isSubscribed && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleSendNotification()}
          disabled={isSending}
          className="transition-all duration-200"
          aria-label="テスト通知を送信"
          data-testid="push-notification-test-button"
        >
          {isSending ? (
            <>
              <Send className="mr-2 h-4 w-4 animate-pulse" />
              送信中
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              テスト通知
            </>
          )}
        </Button>
      )}
    </div>
  );
}
```

このコンポーネントは以下の機能を提供します：

1. プッシュ通知の購読状態管理

   - ローカルストレージを使用して状態を永続化
   - Service Workerの登録状態の確認
   - 購読情報のデータベース保存

2. UI機能

   - 通知オン/オフの切り替えボタン
   - テスト通知送信ボタン
   - ローディング状態の表示
   - トースト通知によるフィードバック

3. エラーハンドリング

   - ブラウザ対応チェック
   - 通知許可の確認
   - 各種エラー状態の適切な処理

4. アクセシビリティ
   - ARIA属性の適切な設定
   - キーボード操作対応
   - 状態変化の適切な通知

### API Route (app/api/push/route.ts)

プッシュ通知を送信するAPIエンドポイントを実装します：

```typescript
import webPush from "web-push";
import { env } from "~/env";

webPush.setVapidDetails(
  `mailto:${env.VAPID_EMAIL}`,
  env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY,
);

// プッシュ通知送信のエンドポイント実装
```

## アイコンについて

以下のアイコンを`public`ディレクトリに配置する必要があります：

- `icon512_maskable.png` - マスク可能なアイコン（512x512）
- `icon512_rounded.png` - 通常のアイコン（512x512）

## テスト

PWA機能のテストを行う際は以下の点を確認してください：

1. Service Workerの登録
2. マニフェストファイルの読み込み
3. オフライン動作
4. プッシュ通知の送受信
5. インストール機能

## 注意点

1. 開発環境ではPWAが無効になっています（`next-pwa`の設定で制御）
2. プッシュ通知はHTTPS環境でのみ動作します
3. アイコンは必ずPWAガイドラインに従ったサイズと形式で用意してください
4. Service Workerのスコープに注意してください
