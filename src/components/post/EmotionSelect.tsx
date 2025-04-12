import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/utils/api";
import { EMOTION_TAGS } from "~/constants/emotions";
import type { EmotionTag } from "@prisma/client";

interface EmotionSelectProps {
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function EmotionSelect({
  selectedId,
  onSelect,
  disabled,
}: EmotionSelectProps) {
  const { data: emotionTags } = api.emotionTag.getAll.useQuery();

  return (
    <Select value={selectedId} onValueChange={onSelect} disabled={disabled}>
      <SelectTrigger className="w-full" aria-label="感情を選択してください">
        <SelectValue placeholder="感情を選択してください" />
      </SelectTrigger>
      <SelectContent>
        {emotionTags?.map((tag: EmotionTag) => {
          const emotionInfo = EMOTION_TAGS.find((e) => e.name === tag.name);
          return (
            <SelectItem key={tag.id} value={tag.id}>
              {emotionInfo?.emoji} {tag.name}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
