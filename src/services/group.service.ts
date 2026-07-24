import api from "@/lib/axios";

import type { CreateGroupRequest, GroupResponse } from "@/types/group";

class GroupService {
  async createGroup(payload: CreateGroupRequest): Promise<GroupResponse> {
    const { data } = await api.post<GroupResponse>(
      "/groups",
      payload
    );

    return data;
  }
}

export const groupService = new GroupService();

export default groupService;
