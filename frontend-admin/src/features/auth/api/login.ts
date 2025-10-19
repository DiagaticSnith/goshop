import { useMutation } from "@tanstack/react-query";
import { api } from "../../../app/api";

const sessionLogin = async (idToken: string): Promise<any> => {
    return api.post("/auth/session-login", { idToken }).then(response => response.data);
};

export { sessionLogin };

export const useSessionLoginMutation = () => {
    return useMutation({
        mutationFn: (idToken: string) => sessionLogin(idToken)
    });
};

