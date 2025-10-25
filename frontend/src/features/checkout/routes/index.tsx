import { Route, Routes } from "react-router-dom";
import CheckoutSuccess from "./CheckoutSuccess";
import CheckoutCancel from "./CheckoutCancel";

export const CheckoutRoutes = () => {
    return (
        <Routes>
            <Route path="success" element={<CheckoutSuccess />} />
            <Route path="cancel" element={<CheckoutCancel />} />
        </Routes>
    );
};
