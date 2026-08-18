import api from "@/lib/axios";

import type {
  ContactResponse,
  ContactsResponse,
  ListContactsParams,
} from "@/types/contact";

class ContactService {
  async listContacts(params: ListContactsParams = {}): Promise<ContactsResponse> {
    const { data } = await api.get<ContactsResponse>("/users/contacts", {
      params,
    });

    return data;
  }

  async addContact(userId: string): Promise<ContactResponse> {
    const { data } = await api.post<ContactResponse>("/users/contacts", {
      user_id: userId,
    });
    return data;
  }

  async removeContact(userId: string): Promise<void> {
    await api.delete(`/users/contacts/${encodeURIComponent(userId)}`);
  }
}

export const contactService = new ContactService();

export default contactService;
