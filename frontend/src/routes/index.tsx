import { Routes, Route } from "react-router-dom";
import { AuthRoutes } from "../features/auth";
import { CartRoutes } from "../features/cart";
import { ProductRoutes } from "../features/products";
import { ProtectedRoute } from "./ProtectedRoute";
import { Dashboard, Home } from "../features/misc";
import AdminDashboard from "../features/misc/routes/AdminDashboard";
import { CheckoutRoutes } from "../features/checkout";

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/">
                {/* Home remains default for users */}
                <Route index element={<Home />} />
                <Route path="auth/*" element={<AuthRoutes />} />
                <Route path="cart/*" element={<CartRoutes />} />
                <Route path="products/*" element={<ProductRoutes />} />
            </Route>

            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/checkout/*" element={<CheckoutRoutes />} />
            </Route>
        </Routes>
    );
};
