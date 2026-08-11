"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from "@mui/material";
import { Close, Tag, ArrowForward, Subject } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import IconTextField from "@/components/auth/IconTextField";
import channelStore from "@/stores/ChannelStore";
import type { ChannelTopic } from "@/types/channel";

interface CreateTopicModalProps {
  open: boolean;
  onClose: () => void;
  channelId: string;
  onCreated?: (topic: ChannelTopic) => void;
}

function CreateTopicModal({ open, onClose, channelId, onCreated }: CreateTopicModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const resetAndClose = () => {
    setName("");
    setDescription("");
    setFormError(null);
    channelStore.clearTopicActionError();
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setFormError("Thread name is required.");
      return;
    }

    setFormError(null);
    const topic = await channelStore.createChannelTopic(channelId, {
      name: trimmedName,
      description: description.trim() || undefined,
    });

    if (topic) {
      onCreated?.(topic);
      resetAndClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={channelStore.isSavingTopic ? undefined : resetAndClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: 3, p: { xs: 1, sm: 1.5 } } } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h1" component="h2" sx={{ fontSize: "1.4rem" }}>
              New thread
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Start a separate conversation inside this channel.
            </Typography>
          </Box>
          <IconButton
            aria-label="Close"
            onClick={resetAndClose}
            disabled={channelStore.isSavingTopic}
            edge="end"
            size="small"
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <IconTextField
            label="Thread name"
            icon={Tag}
            placeholder="onboarding-feedback"
            value={name}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setName(event.target.value);
              setFormError(null);
            }}
            autoFocus
            required
          />

          <IconTextField
            label="Description"
            icon={Subject}
            placeholder="What is this thread about?"
            value={description}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setDescription(event.target.value)}
            multiline
            minRows={2}
          />

          {(formError || channelStore.topicActionError) ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError ?? channelStore.topicActionError}
            </Alert>
          ) : null}

          <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
            <Button
              type="button"
              variant="text"
              color="inherit"
              size="large"
              fullWidth
              onClick={resetAndClose}
              disabled={channelStore.isSavingTopic}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={channelStore.isSavingTopic}
              endIcon={<ArrowForward fontSize="small" />}
            >
              {channelStore.isSavingTopic ? "Creating…" : "Create thread"}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default observer(CreateTopicModal);
