import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='100%25' height='100%25' fill='%23eee'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='18' font-family='Arial'%3EAvatar%3C/text%3E%3C/svg%3E";

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
                    <li className="font-medium text-sm text-dark relative ml-5">
                        <button className="flex items-center" onClick={handleNavClick}>
                            <span className="sr-only">Account</span>
                            <img className="w-8 h-8 rounded-full" src={currentUser?.photoURL || defaultAvatar} alt="User avatar" />
                            <FaChevronDown className="ml-1 text-secondary" />
                        </button>

                        {dropdownOpen && (
                            <div className="z-10 transform animate-dropdown origin-top-right absolute mb-10 mt-4 right-0 bg-white divide-y divide-gray-100 rounded-lg shadow w-44">
                                {currentUser &&
                                <div className="px-4 py-3 text-sm text-dark">
                                    <div>{currentUser?.displayName}</div>
                                    <div className="font-medium truncate">
                                        {currentUser?.email}
                                    </div>
                                </div>
                                }
                                <ul className="py-2 text-sm text-dark-200">
                                    <li>
                                        <Link
                                            to="/admin?tab=products"
                                            className="block px-4 py-2 hover:bg-gray-100"
                                        >
                        Dashboard
                                        </Link>
                                    </li>
                                </ul>
                                        <div className="py-2">
                                            {currentUser ? (
                                                <button
                                                    onClick={handleSignOut}
                                                    className="px-4 py-2 text-left hover:bg-gray-100 w-full text-sm text-dark"
                                                >
                                                    Sign out
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => navigate('/auth/login')}
                                                    className="px-4 py-2 text-left hover:bg-gray-100 w-full text-sm text-dark"
                                                >
                                                    Sign in
                                                </button>
                                            )}
                                        </div>
                            </div>
                        )}
                    </li>
                </div>
            </ul>
        </div>
    );
};

export default Navbar;
