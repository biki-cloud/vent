import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { api } from "~/utils/api";
import { EMOTION_TAGS } from "~/constants/emotions";
import { createTRPCReact } from "@trpc/react-query";
import { type AppRouter } from "~/server/api/root";
import superjson from "superjson";
import type { ReactNode } from "react";
import { useState } from "react";

export const mockEmotionTags = EMOTION_TAGS.map((tag, index) => ({
  ...tag,
  id: String(index + 1),
}));

export const mockTrpc = createTRPCReact<AppRouter>();

const mockAddStampMutation = jest.fn();
const mockInvalidate = jest.fn();
const mockSetInfiniteData = jest.fn();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const trpcClient = mockTrpc.createClient({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/api/trpc",
      transformer: superjson,
    }),
  ],
});

export const mockApi = {
  useContext: () => ({
    post: {
      getAll: {
        cancel: jest.fn(),
        getInfiniteData: jest.fn(),
        setInfiniteData: jest.fn(),
        invalidate: jest.fn(),
      },
      getById: {
        cancel: jest.fn(),
        getData: jest.fn(),
        setData: jest.fn(),
        invalidate: jest.fn(),
      },
    },
  }),
  createClient: () => trpcClient,
  Provider: mockTrpc.Provider,
  emotionTag: {
    getAll: {
      useQuery: jest.fn(() => ({
        data: mockEmotionTags,
      })),
    },
  },
  post: {
    getById: jest.fn(),
    getAll: {
      useInfiniteQuery: jest.fn(),
      cancel: jest.fn(),
      setInfiniteData: mockSetInfiniteData,
    },
    create: {
      useMutation: jest.fn(),
    },
    delete: {
      useMutation: jest.fn(),
    },
    addStamp: {
      useMutation: () => ({
        mutate: mockAddStampMutation,
        isLoading: false,
      }),
      invalidate: mockInvalidate,
    },
    getClientId: {
      useQuery: () => ({
        data: "test-client-id",
      }),
    },
  },
};

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <mockTrpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </mockTrpc.Provider>,
  );
}

export function TestWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function withTRPC<T extends React.ComponentType<any>>(Component: T): T {
  return function WrappedComponent(props: React.ComponentProps<T>) {
    return (
      <mockTrpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <Component {...props} />
        </QueryClientProvider>
      </mockTrpc.Provider>
    );
  } as T;
}

// next/navigationのモック
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

export * from "@testing-library/react";
