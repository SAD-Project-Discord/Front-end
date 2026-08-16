import Box from "@mui/material/Box";

export interface UnreadBadgeProps {
  count: number;
}

export function UnreadBadge({ count }: UnreadBadgeProps) {
  return (
    <Box
      sx={{
        flexShrink: 0,
        minWidth: 18,
        height: 18,
        borderRadius: "50%",
        bgcolor: "primary.main",
        color: "primary.contrastText",
        fontSize: 11,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 0.5,
      }}
    >
      {count > 99 ? "99+" : count}
    </Box>
  );
}
