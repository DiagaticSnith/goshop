import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider } from "../app/firebase";
import { User, signInWithEmailAndPassword, UserCredential, signInWithCustomToken, signInWithPopup } from "firebase/auth";
import { useRegisterMutation } from "../features/auth";
import { useDispatch } from "react-redux";
import { clearCart } from "../features/cart/cartSlice";
import { api } from "../app/api";

interface Props {
    children: ReactNode;
}

interface IAuthContext {
    currentUser: User | null;
    isAdmin: boolean | undefined;
    token: string;
    signIn: (email: string, password: string) => Promise<UserCredential> | null;
    signInWithToken: (token: string) => Promise<UserCredential> | null;
    signInWithGoogle: () => Promise<UserCredential> | null;
    signUp: (data: IRegisterCredentials) => Promise<UserCredential> | null;
    signOut: () => void;
}


const AuthContext = createContext<IAuthContext>({
    currentUser: null,
    token: "",
    isAdmin: undefined,
    signIn: () => null,
    signInWithToken: () => null,
    signInWithGoogle: () => null,
    signUp: () => null,
    signOut: () => undefined
});


export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }: Props) => {
    const dispatch = useDispatch();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [token, setToken] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAdmin, setIsAdmin] = useState<boolean>();

    const { mutateAsync: register } = useRegisterMutation();

    const handleCurrentUser = async (user: User | null) => {
        if (user) {
            setCurrentUser(user);
            const decoded = await user.getIdTokenResult();
            setToken(decoded.token);
            // Prefer role from DB (localStorage set by /auth/session-login). Fallback to Firebase claims.
            const claimRole = (decoded.claims as any)?.role as string | undefined;
            const ls = localStorage.getItem("userInfo");
            let lsRole: string | undefined;
            if (ls) {
                try {
                    const parsed = JSON.parse(ls);
                    lsRole = parsed?.role;
                } catch {}
            }
            if (lsRole) {
                setIsAdmin(lsRole === "ADMIN");
            } else if (claimRole) {
                setIsAdmin(claimRole === "ADMIN");
            } else {
                setIsAdmin(undefined);
            }

            // Background: refresh role from backend /auth/me to ensure DB is source of truth
            try {
                const me = await api.get("/auth/me", { headers: { Authorization: `Bearer ${decoded.token}` } });
                if (me?.data?.role) {
                    const nextInfo = { email: me.data.email, role: me.data.role, fullName: me.data.fullName };
                    localStorage.setItem("userInfo", JSON.stringify(nextInfo));
                    setIsAdmin(me.data.role === "ADMIN");
                }
            } catch (e) {
                // ignore fetch /auth/me errors; rely on existing info
            }
        } else {
            setCurrentUser(null);
            setToken("");
            setIsAdmin(undefined);
        }
        setIsLoading(false);
    };

    const signIn = async (email: string, password: string) => {
        return await signInWithEmailAndPassword(auth, email, password);
    };

    const signInWithToken = async (token: string) => {
        return await signInWithCustomToken(auth, token);
    };

    const signInWithGoogle = async () => {
        return await signInWithPopup(auth, googleProvider);
    };

    const signUp = async (data: IRegisterCredentials) => {
        const { token } = await register(data);
        // Clear any previous user-specific localStorage (cart, userInfo) to avoid stale data
        try {
            localStorage.removeItem("cart");
            localStorage.removeItem("userInfo");
        } catch (e) {
            // ignore
        }
        // reset redux cart state
        dispatch(clearCart());

        return await signInWithToken(token);
    };

    const signOut = () => {
        auth.signOut();
        // remove user related local storage keys
        try {
            localStorage.removeItem("cart");
            localStorage.removeItem("userInfo");
        } catch (e) {}
        dispatch(clearCart());
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(handleCurrentUser);
        return () => unsubscribe();
    }, []);

    const value = {
        currentUser,
        isAdmin,
        token,
        signIn,
        signInWithToken,
        signInWithGoogle,
        signUp,
        signOut
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};
