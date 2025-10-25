import { useMutation } from "@tanstack/react-query";
import { api } from "../../../app/api";

type CreateSessionData = { lineItems: ILineItem[]; userId: string; address?: string; email?: string };

const createCheckoutSession = (sessionData: CreateSessionData, token: string): Promise<{sessionId: string}> => {
    return api.post("/checkout/create-session", sessionData, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }).then(response => response.data);
};

export const useCreateCheckoutSessionMutation = (token: string) => {
    return useMutation({
        mutationFn: (sessionData: CreateSessionData) => createCheckoutSession(sessionData, token)
    });
};
