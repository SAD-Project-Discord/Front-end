import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/material/styles";

export interface TypingIndicatorProps {
  /** Display names of whoever is currently typing. Renders nothing if empty. */
  typingUserNames?: string[];
}

const bounce = keyframes`
  0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
  40% { transform: translateY(-3px); opacity: 1; }
`;

export function TypingIndicator({ typingUserNames = [] }: TypingIndicatorProps) {
  if (typingUserNames.length === 0) return null;

  return (
    <Box role="status" aria-live="polite" sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, borderRadius: 5, bgcolor: "action.selected", px: 1.25, py: 0.75 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              bgcolor: "text.secondary",
              animation: `${bounce} 1s infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" noWrap>
        {formatTypingLabel(typingUserNames)}
      </Typography>
    </Box>
  );
}

function formatTypingLabel(names: string[]): string {
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing…`;
}
