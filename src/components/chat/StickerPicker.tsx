"use client";

import { useEffect, useState } from "react";
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { stickersApi, type StickerPack } from "@/lib/api/stickers";

export interface StickerPickerProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (sticker: { id: string; url: string }) => void;
}

export function StickerPicker({ anchorEl, onClose, onSelect }: StickerPickerProps) {
  const [packs, setPacks] = useState<StickerPack[] | null>(null);

  useEffect(() => {
    if (!anchorEl) return;
    let cancelled = false;
    stickersApi
      .getPacks()
      .then((res) => {
        if (!cancelled) setPacks(res.data);
      })
      .catch(() => {
        if (!cancelled) setPacks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [anchorEl]);

  const stickers = packs?.flatMap((pack) => pack.stickers) ?? [];

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      slotProps={{ paper: { sx: { p: 1.5, width: 280 } } }}
    >
      {packs === null ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={20} />
        </Box>
      ) : stickers.length === 0 ? (
        <Box sx={{ py: 2, px: 1, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            No sticker packs available yet
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0.5 }}>
          {stickers.map((sticker) => (
            <ButtonBase
              key={sticker.id}
              onClick={() => {
                onSelect(sticker);
                onClose();
              }}
              sx={{ borderRadius: 1.5, p: 0.5, "&:hover": { bgcolor: "action.hover" } }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sticker.url} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "auto" }} />
            </ButtonBase>
          ))}
        </Box>
      )}
    </Popover>
  );
}
