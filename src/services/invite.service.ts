import api from "@/lib/axios";

import type { InvitePreviewResponse } from "@/types/invite";

class InviteService {
  async previewInvite(token: string): Promise<InvitePreviewResponse> {
    const { data } = await api.get<InvitePreviewResponse>(`/invites/${token}`);
    return data;
  }

  async acceptInvite(token: string): Promise<InvitePreviewResponse> {
    const { data } = await api.post<InvitePreviewResponse>(`/invites/${token}/join`, {});
    return data;
  }
}

export const inviteService = new InviteService();

export default inviteService;
