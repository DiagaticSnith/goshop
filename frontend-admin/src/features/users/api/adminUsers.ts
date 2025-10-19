import { api } from "../../../app/api";

export const listUsers = (token: string, q?: string, includeHidden?: boolean) => {
  return api.get<IUser[]>("/users", {
    headers: { Authorization: `Bearer ${token}` },
    params: { q, includeHidden: includeHidden ? "1" : undefined }
  }).then(res => res.data);
};

export const toggleUserStatus = (token: string, firebaseId: string) => {
  return api.post<IUser>(`/users/${firebaseId}/toggle-status`, undefined, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data);
};

export const updateUserRole = (token: string, firebaseId: string, role: "USER" | "ADMIN") => {
  return api.post<IUser>(`/users/${firebaseId}/role`, { role }, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data);
};
