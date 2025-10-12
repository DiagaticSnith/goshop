import { Route, Routes } from "react-router-dom";
import Shop from "./Shop";
import Product from "./Product";

export const ProductRoutes = () => {
    return (
        <Routes>
            <Route path="shop" element={<Shop />} />
            <Route path=":productId" element={<Product />} />
        </Routes>
    );
};
