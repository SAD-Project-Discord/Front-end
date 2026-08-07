"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { Public, Subject, Close, ArrowForward } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import IconTextField from "@/components/auth/IconTextField";
import channelStore from "@/stores/ChannelStore";
import type { Channel } from "@/types/channel";

interface CreateChannelModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (channel: Channel) => void;
}

interface CreateChannelFormValues {
  name: string;
  description: string;
  isPrivate: boolean;
}

const initialValues: CreateChannelFormValues = {
  name: "",
  description: "",
  isPrivate: false,
};

function CreateChannelModal({ open, onClose, onCreated }: CreateChannelModalProps) {
  const [values, setValues] = useState<CreateChannelFormValues>(initialValues);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange =
    (field: keyof CreateChannelFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "isPrivate" ? event.target.checked : event.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));
      if (formError) {
        setFormError(null);
      }
    };

  const resetAndClose = () => {
    setValues(initialValues);
    setFormError(null);
    channelStore.setError(null);
    onClose();
  };

  const validateForm = () => {
    const name = values.name.trim();

    if (!name) {
      return "Channel name is required.";
    }

    if (name.length < 2) {
      return "Channel name must be at least 2 characters long.";
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      channelStore.setError(null);
      return;
    }

    setFormError(null);
    channelStore.setError(null);

    const description = values.description.trim();

    const channel = await channelStore.createChannel({
      name: values.name.trim(),
      description: description || undefined,
      is_private: values.isPrivate,
    });

    if (channel) {
      onCreated?.(channel);
      resetAndClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={channelStore.isLoading ? undefined : resetAndClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            p: { xs: 1, sm: 1.5 },
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h1" component="h2" sx={{ fontSize: "1.4rem" }}>
              Create Channel
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Start a new channel for your conversation.
            </Typography>
          </Box>
          <IconButton
            aria-label="Close"
            onClick={resetAndClose}
            disabled={channelStore.isLoading}
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
            label="Channel Name"
            icon={Public}
            placeholder="General"
            value={values.name}
            onChange={handleChange("name")}
            autoFocus
            required
          />

          <IconTextField
            label="Description"
            icon={Subject}
            placeholder="What is this channel for?"
            value={values.description}
            onChange={handleChange("description")}
            multiline
            minRows={2}
          />

          <FormControlLabel
            sx={{ mt: 0.5, ml: 0, width: "100%", justifyContent: "space-between" }}
            control={
              <Switch
                checked={values.isPrivate}
                onChange={handleChange("isPrivate")}
              />
            }
            labelPlacement="start"
            label={
              <Box>
                <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 500 }}>
                  Private channel
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Only invited members can see this channel.
                </Typography>
              </Box>
            }
          />

          {(formError || channelStore.error) ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError ?? channelStore.error}
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
              disabled={channelStore.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={channelStore.isLoading}
              endIcon={<ArrowForward fontSize="small" />}
            >
              {channelStore.isLoading ? "Creating..." : "Create Channel"}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default observer(CreateChannelModal);
