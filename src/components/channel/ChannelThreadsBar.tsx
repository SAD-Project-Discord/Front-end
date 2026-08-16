"use client";

import { useEffect, useState } from "react";
import { Box, Chip, CircularProgress, Stack, Tooltip } from "@mui/material";
import { AddRounded, TagRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import channelStore from "@/stores/ChannelStore";
import CreateTopicModal from "@/components/channel/CreateTopicModal";

interface ChannelThreadsBarProps {
  channelId: string;
  canManageTopics: boolean;
  activeTopicId: string | undefined;
  onSelectTopic: (topicId: string | undefined) => void;
}

function ChannelThreadsBar({ channelId, canManageTopics, activeTopicId, onSelectTopic }: ChannelThreadsBarProps) {
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    channelStore.loadChannelTopics(channelId);
  }, [channelId]);

  async function handleDeleteTopic(topicId: string) {
    const wasActive = activeTopicId === topicId;
    const deleted = await channelStore.deleteChannelTopic(channelId, topicId);
    if (deleted && wasActive) {
      onSelectTopic(undefined);
    }
  }

  if (channelStore.channelTopicsLoading && channelStore.channelTopics.length === 0) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1 }}>
        <CircularProgress size={16} />
      </Box>
    );
  }

  if (channelStore.channelTopics.length === 0 && !canManageTopics) {
    return null;
  }

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          px: 2,
          py: 1,
          overflowX: "auto",
          borderBottom: 1,
          borderColor: "divider",
          alignItems: "center",
        }}
      >
        <Chip
          icon={<TagRounded fontSize="small" />}
          label="general"
          size="small"
          color={activeTopicId === undefined ? "primary" : "default"}
          variant={activeTopicId === undefined ? "filled" : "outlined"}
          onClick={() => onSelectTopic(undefined)}
        />
        {channelStore.channelTopics.map((topic) => (
          <Tooltip key={topic.id} title={topic.description || ""} disableHoverListener={!topic.description}>
            <Chip
              icon={<TagRounded fontSize="small" />}
              label={topic.name}
              size="small"
              color={activeTopicId === topic.id ? "primary" : "default"}
              variant={activeTopicId === topic.id ? "filled" : "outlined"}
              onClick={() => onSelectTopic(topic.id)}
              onDelete={canManageTopics ? () => handleDeleteTopic(topic.id) : undefined}
            />
          </Tooltip>
        ))}
        {canManageTopics ? (
          <Chip
            icon={<AddRounded fontSize="small" />}
            label="New thread"
            size="small"
            variant="outlined"
            onClick={() => setCreateOpen(true)}
          />
        ) : null}
      </Stack>

      <CreateTopicModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        channelId={channelId}
        onCreated={(topic) => onSelectTopic(topic.id)}
      />
    </>
  );
}

export default observer(ChannelThreadsBar);
