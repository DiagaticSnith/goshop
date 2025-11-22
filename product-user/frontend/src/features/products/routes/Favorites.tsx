import Navbar from "../../../components/Elements/Navbar";
import { Link } from "react-router-dom";

const Favorites = () => {
    return (
        <div className="container">
            <Navbar />
            <h3 className="font-semibold text-3xl mb-8">Favorites (disabled)</h3>
            <p>Favorites feature has been removed. <Link to="/products/shop" className="text-primary underline">Go to shop</Link></p>
        </div>
    );
};

export default Favorites;
