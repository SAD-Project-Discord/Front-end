import api from "@/lib/axios";

import type { ContactsResponse } from "@/types/contact";

class ContactService {
  /** Users the current user has exchanged direct messages with. */
  async listContacts(query?: string): Promise<ContactsResponse> {
    const { data } = await api.get<ContactsResponse>("/users/contacts", {
      params: query ? { q: query } : undefined,
    });

    return data;
  }
}

export const contactService = new ContactService();

export default contactService;
