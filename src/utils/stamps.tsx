"use client";

import { type ReactNode } from "react";

export interface StampConfig {
  icon: ReactNode;
  label: string;
}

export type StampType = "thanks" | "love" | "smile" | "cry" | "sad" | "shock";

export const stampConfig: Record<StampType, StampConfig> = {
  thanks: {
    icon: <span className="text-xl">😢</span>,
    label: "ありがとうボタン",
  },
  love: {
    icon: <span className="text-xl">🥰</span>,
    label: "大好きボタン",
  },
  smile: {
    icon: <span className="text-xl">😁</span>,
    label: "笑顔ボタン",
  },
  cry: {
    icon: <span className="text-xl">😭</span>,
    label: "号泣ボタン",
  },
  sad: {
    icon: <span className="text-xl">🥺</span>,
    label: "悲しいボタン",
  },
  shock: {
    icon: <span className="text-xl">😱</span>,
    label: "ショックボタン",
  },
} as const;
