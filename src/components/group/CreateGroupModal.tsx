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
import { Groups, Subject, Close, ArrowForward } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import IconTextField from "@/components/auth/IconTextField";
import groupStore from "@/stores/GroupStore";
import type { Group } from "@/types/group";

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (group: Group) => void;
}

interface CreateGroupFormValues {
  name: string;
  description: string;
  isPrivate: boolean;
}

const initialValues: CreateGroupFormValues = {
  name: "",
  description: "",
  isPrivate: true,
};

function CreateGroupModal({ open, onClose, onCreated }: CreateGroupModalProps) {
  const [values, setValues] = useState<CreateGroupFormValues>(initialValues);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange =
    (field: keyof CreateGroupFormValues) =>
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
    groupStore.setError(null);
    onClose();
  };

  const validateForm = () => {
    const name = values.name.trim();

    if (!name) {
      return "Group name is required.";
    }

    if (name.length < 2) {
      return "Group name must be at least 2 characters long.";
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      groupStore.setError(null);
      return;
    }

    setFormError(null);
    groupStore.setError(null);

    const description = values.description.trim();

    const group = await groupStore.createGroup({
      name: values.name.trim(),
      description: description || undefined,
      member_ids: [],
      is_private: values.isPrivate,
    });

    if (group) {
      onCreated?.(group);
      resetAndClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={groupStore.isLoading ? undefined : resetAndClose}
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
              Create Group
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Start a new group and invite people later.
            </Typography>
          </Box>
          <IconButton
            aria-label="Close"
            onClick={resetAndClose}
            disabled={groupStore.isLoading}
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
            label="Group Name"
            icon={Groups}
            placeholder="Project Team"
            value={values.name}
            onChange={handleChange("name")}
            autoFocus
            required
          />

          <IconTextField
            label="Description"
            icon={Subject}
            placeholder="What is this group about?"
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
                  Private group
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Only invited members can join.
                </Typography>
              </Box>
            }
          />

          {(formError || groupStore.error) ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError ?? groupStore.error}
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
              disabled={groupStore.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={groupStore.isLoading}
              endIcon={<ArrowForward fontSize="small" />}
            >
              {groupStore.isLoading ? "Creating..." : "Create Group"}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default observer(CreateGroupModal);
