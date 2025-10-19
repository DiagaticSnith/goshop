import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider } from "../app/firebase";
import { User, signInWithEmailAndPassword, UserCredential, signInWithCustomToken, signInWithPopup } from "firebase/auth";
import { useRegisterMutation } from "../features/auth";
import { useDispatch } from "react-redux";
import { clearCart, setCart } from "../features/cart/cartSlice";
import * as cartApi from "../features/cart/api";

interface Props {
    children: ReactNode;
}

interface IAuthContext {
    currentUser: User | null;
    isAdmin: boolean | undefined;
    token: string;
    isLoading: boolean;
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
    isLoading: true,
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
            // Xác định role: ưu tiên custom claims trên Firebase, fallback localStorage
            try {
                const claimRole = (decoded.claims as any)?.role;
                if (claimRole === "ADMIN") {
                    setIsAdmin(true);
                } else if (claimRole === "USER") {
                    setIsAdmin(false);
                } else {
                    // Chưa có claim: thử lấy từ localStorage nếu đã có session-login
                    const userInfo = localStorage.getItem("userInfo");
                    if (userInfo) {
                        const parsed = JSON.parse(userInfo);
                        setIsAdmin(parsed.role === "ADMIN");
                    } else {
                        // Chưa biết, để undefined để UI chờ thay vì deny sớm
                        setIsAdmin(undefined);
                    }
                }
            } catch {
                // Nếu lỗi khi decode claim, giữ undefined để UI chờ
                setIsAdmin(undefined);
            }
            // fetch server cart and sync to redux
            try {
                const serverCart = await cartApi.getCart(decoded.token);
                // serverCart.items has shape with product and totalQuantity
                const items = (serverCart.items || []).map((it: any) => ({ product: it.product as IProduct, quantity: it.totalQuantity }));
                dispatch(setCart(items));
            } catch (e) {
                // ignore if unable to fetch
            }
        } else {
            setCurrentUser(null);
            setToken("");
            setIsAdmin(undefined);
        }
        setIsLoading(false);
    };

    // Sau khi token cập nhật (đăng nhập xong), kiểm tra lại localStorage để tránh race-condition
    useEffect(() => {
        if (!token) return;
        try {
            const userInfo = localStorage.getItem("userInfo");
            if (userInfo) {
                const parsed = JSON.parse(userInfo);
                setIsAdmin(parsed?.role === "ADMIN");
            }
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

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

        if (!token) {
            throw new Error("Missing custom token from register response");
        }
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
        isLoading,
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