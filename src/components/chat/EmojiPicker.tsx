import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";

export interface EmojiPickerProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

// A small curated set covering common reactions/expressions — kept
// dependency-free rather than pulling in a full emoji-data package.
const EMOJI = [
  "😀", "😂", "😅", "😊", "😍", "🥰", "😘", "😉",
  "😎", "🤔", "🙄", "😴", "😭", "😢", "😡", "🤯",
  "🥳", "😱", "🤗", "🙌", "👍", "👎", "👏", "🙏",
  "💪", "🤝", "❤️", "🔥", "💯", "✨", "🎉", "👀",
];

export function EmojiPicker({ anchorEl, onClose, onSelect }: EmojiPickerProps) {
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      slotProps={{ paper: { sx: { p: 1 } } }}
    >
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 0.25, width: 280 }}>
        {EMOJI.map((emoji) => (
          <ButtonBase
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            sx={{ fontSize: 20, borderRadius: 1.5, height: 34, "&:hover": { bgcolor: "action.hover" } }}
          >
            {emoji}
          </ButtonBase>
        ))}
      </Box>
    </Popover>
  );
}
