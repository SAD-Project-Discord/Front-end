import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import type { DmContact } from "@/lib/chat/dmContacts";
import { ConversationItem } from "./ConversationItem";

export interface ConversationListProps {
  contacts: DmContact[];
  activeContactId?: string;
  onSelectContact: (userId: string) => void;
  emptyState?: React.ReactNode;
}

export function ConversationList({ contacts, activeContactId, onSelectContact, emptyState }: ConversationListProps) {
  if (contacts.length === 0) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", px: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {emptyState ?? "No conversations yet"}
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ flex: 1, overflowY: "auto", py: 0.5 }} aria-label="Direct messages">
      {contacts.map((contact) => (
        <ConversationItem
          key={contact.userId}
          contact={contact}
          isActive={contact.userId === activeContactId}
          onSelect={onSelectContact}
        />
      ))}
    </List>
  );
}
