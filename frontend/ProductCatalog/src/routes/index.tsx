import { Routes, Route } from "react-router-dom";
import { ProductRoutes } from "../features/products";
import { ProtectedRoute } from "./ProtectedRoute";
import { Dashboard, Home } from "../features/misc";

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/">
                <Route index element={<Home />} />
                <Route path="products/*" element={<ProductRoutes />} />
            </Route>

            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />

            </Route>
        </Routes>
    );
};
