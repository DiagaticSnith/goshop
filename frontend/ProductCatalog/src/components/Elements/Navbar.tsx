import { BsFillBasket3Fill } from "react-icons/bs";
import { ImSearch } from "react-icons/im";
import { MdFavorite } from "react-icons/md";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import defaultAvatar from "../../assets/images/default-avatar.webp";

const Navbar = () => {
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

    const { signOut, currentUser } = useAuth();
    const navigate = useNavigate();
    const handleNavClick = () => {
        setDropdownOpen(prevState => !prevState);
    };

    const handleSignOut = () => {
        signOut();
        navigate("/auth/login");
    };

    return (
        <div className="bg-white px-2 xs:px-6 py-5 justify-between rounded-xl items-center my-4 drop-shadow-lg relative z-30">
            <ul className="flex items-center text-sm justify-between">
                <li className="font-bold text-dark">
                    <Link to="/">GoShop</Link>
                </li>
                <div className="flex text-secondary text-lg items-center">
                    <li className="transition-colors hover:text-dark ml-3">
                        <Link to="/products/shop">
                            <ImSearch />
                        </Link>
                    </li>
                    <li className="transition-colors hover:text-dark ml-3">
                        <Link to="/products/favorites">
                            <MdFavorite />
                        </Link>
                    </li>
                    
                </div>
            </ul>
        </div>
    );
};

export default Navbar;