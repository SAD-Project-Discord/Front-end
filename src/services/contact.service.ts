import api from "@/lib/axios";

import type { ContactStatus, ContactsResponse } from "@/types/contact";

class ContactService {
  async listContacts(status: ContactStatus = "accepted"): Promise<ContactsResponse> {
    const { data } = await api.get<ContactsResponse>("/contacts", {
      params: { status },
    });

    return data;
  }
}

export const contactService = new ContactService();

export default contactService;
