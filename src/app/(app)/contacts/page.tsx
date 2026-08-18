"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ChatBubbleOutlineRounded,
  DeleteOutlineRounded,
  PersonAddRounded,
  PeopleAltRounded,
  SearchRounded,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";

import AddContactDialog from "@/components/contacts/AddContactDialog";
import { openUserProfile } from "@/lib/profileNav";
import { chatSurfaces } from "@/lib/theme/theme";
import contactStore from "@/stores/ContactStore";
import userStore from "@/stores/UserStore";
import type { PublicUserProfile } from "@/types/user";

const SEARCH_DEBOUNCE_MS = 300;

function ContactsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<PublicUserProfile | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(
      () => contactStore.loadContacts(query),
      query.trim() ? SEARCH_DEBOUNCE_MS : 0,
    );
    return () => clearTimeout(handle);
  }, [query]);

  async function handleRemove() {
    if (!pendingRemoval) return;
    const removed = pendingRemoval;
    const ok = await contactStore.removeContact(removed.id);
    if (!ok) return;

    userStore.setContactStatus(removed.id, false);
    setPendingRemoval(null);
    setNotice(`${removed.name} was removed from your contacts.`);
  }

  return (
    <Box sx={{ height: "100%", overflowY: "auto", bgcolor: chatSurfaces.main }}>
      <Box component="main" sx={{ width: "100%", maxWidth: 920, mx: "auto", px: { xs: 2, sm: 4 }, py: { xs: 2.5, sm: 4 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", mb: 3 }}>
          <Box>
            <Typography component="h1" variant="h1" sx={{ fontSize: { xs: "1.6rem", sm: "2rem" }, fontWeight: 750 }}>
              Contacts
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Keep people you talk to easy to find.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddRounded />}
            onClick={() => setAddDialogOpen(true)}
            sx={{ alignSelf: { xs: "stretch", sm: "center" } }}
          >
            Add contact
          </Button>
        </Stack>

        <TextField
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your contacts"
          aria-label="Search your contacts"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2.5 }}
        />

        {contactStore.error || contactStore.actionError ? (
          <Alert
            severity="error"
            action={
              contactStore.error ? (
                <Button color="inherit" size="small" onClick={() => contactStore.loadContacts(query)}>
                  Retry
                </Button>
              ) : undefined
            }
            sx={{ mb: 2 }}
          >
            {contactStore.error ?? contactStore.actionError}
          </Alert>
        ) : null}

        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
          {contactStore.isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress aria-label="Loading contacts" />
            </Box>
          ) : contactStore.contacts.length === 0 ? (
            <Stack sx={{ alignItems: "center", textAlign: "center", px: 3, py: 9 }} spacing={1.5}>
              <PeopleAltRounded color="disabled" sx={{ fontSize: 52 }} />
              <Typography variant="h6" sx={{ fontWeight: 650 }}>
                {query.trim() ? "No matching contacts" : "No contacts yet"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
                {query.trim()
                  ? "Try a different name or username."
                  : "Add someone manually or save them from their profile."}
              </Typography>
              {!query.trim() ? (
                <Button variant="outlined" startIcon={<PersonAddRounded />} onClick={() => setAddDialogOpen(true)}>
                  Find people
                </Button>
              ) : null}
            </Stack>
          ) : (
            <List disablePadding aria-label="Saved contacts">
              {contactStore.contacts.map((contact, index) => (
                <ListItem
                  key={contact.id}
                  disablePadding
                  divider={index < contactStore.contacts.length - 1}
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Message">
                        <IconButton
                          aria-label={`Message ${contact.name}`}
                          onClick={() => router.push(`/dm?open=${encodeURIComponent(contact.id)}`)}
                        >
                          <ChatBubbleOutlineRounded />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove contact">
                        <IconButton
                          aria-label={`Remove ${contact.name} from contacts`}
                          color="error"
                          disabled={contactStore.isRemoving(contact.id)}
                          onClick={() => {
                            contactStore.clearActionError();
                            setPendingRemoval(contact);
                          }}
                        >
                          {contactStore.isRemoving(contact.id) ? <CircularProgress size={20} /> : <DeleteOutlineRounded />}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                >
                  <ListItemButton onClick={() => openUserProfile(contact.id)} sx={{ py: 1.5, pr: 14 }}>
                    <ListItemAvatar>
                      <Avatar src={contact.avatar_url || undefined} sx={{ width: 44, height: 44 }}>
                        {(contact.name || contact.username).charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={contact.name}
                      secondary={`@${contact.username}${contact.bio ? ` · ${contact.bio}` : ""}`}
                      slotProps={{ secondary: { noWrap: true } }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Card>

        {contactStore.hasMore ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2.5 }}>
            <Button variant="outlined" disabled={contactStore.isLoadingMore} onClick={() => contactStore.loadMore()}>
              {contactStore.isLoadingMore ? "Loading…" : "Load more"}
            </Button>
          </Box>
        ) : null}
      </Box>

      <AddContactDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />

      <Dialog
        open={Boolean(pendingRemoval)}
        onClose={() => {
          if (!pendingRemoval || !contactStore.isRemoving(pendingRemoval.id)) setPendingRemoval(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Remove contact?</DialogTitle>
        <DialogContent>
          <Typography>
            {pendingRemoval
              ? `${pendingRemoval.name} will be removed from your contacts. Your message history will not be deleted.`
              : ""}
          </Typography>
          {contactStore.actionError ? <Alert severity="error" sx={{ mt: 2 }}>{contactStore.actionError}</Alert> : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingRemoval(null)} disabled={Boolean(pendingRemoval && contactStore.isRemoving(pendingRemoval.id))}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleRemove}
            disabled={Boolean(pendingRemoval && contactStore.isRemoving(pendingRemoval.id))}
          >
            {pendingRemoval && contactStore.isRemoving(pendingRemoval.id) ? "Removing…" : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(notice)} autoHideDuration={3500} onClose={() => setNotice(null)}>
        {notice ? <Alert severity="success" variant="filled" onClose={() => setNotice(null)}>{notice}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}

export default observer(ContactsPage);
