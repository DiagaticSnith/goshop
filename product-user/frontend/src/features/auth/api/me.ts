import { useQuery } from "@tanstack/react-query";
import { api } from "../../../app/api";

export interface MeResponse {
  email: string;
  role: "USER" | "ADMIN";
  fullName: string;
  status?: "ACTIVE" | "HIDDEN";
}

const fetchMe = async (token: string): Promise<MeResponse> => {
  const res = await api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const useMeQuery = (token?: string) => {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => fetchMe(token || ""),
    enabled: !!token,
    retry: 0
  });
};
