import Navbar from "../../../components/Elements/Navbar";
import { BiSolidShoppingBags, BiSolidUser } from "react-icons/bi";
import { TbTruckDelivery } from "react-icons/tb";
import { AdminProducts } from "../../products/components/AdminProducts";
import Profile from "../../users/components/Profile";
import { useAuth } from "../../../context/AuthContext";
import { Orders } from "../../orders/components/Orders";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useGetOrdersStatsQuery } from "../../orders/api/getOrdersStats";

export const Dashboard = () => {
    const { isAdmin, token } = useAuth();

    const AdminOrdersStats = ({ token }: { token: string }) => {
        const { data, isLoading } = useGetOrdersStatsQuery(token, isAdmin);

        if (!isAdmin) return null;
        if (isLoading || !data) {
            return (
                <div className="mb-6 p-4 bg-white rounded-md drop-shadow-custom">
                    Loading stats...
                </div>
            );
        }

        return (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-md drop-shadow-custom">
                    <h6 className="text-secondary">Total Orders</h6>
                    <p className="font-semibold text-2xl">{data.totalOrders}</p>
                </div>
                <div className="p-4 bg-white rounded-md drop-shadow-custom">
                    <h6 className="text-secondary">Total Revenue</h6>
                    <p className="font-semibold text-2xl">${data.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-white rounded-md drop-shadow-custom">
                    <h6 className="text-secondary">Last 7 days</h6>
                    <ul className="mt-2 text-sm text-secondary space-y-1">
                        {data.statsByDay.map(s => (
                            <li key={s.date} className="flex justify-between">
                                <span>{s.date}</span>
                                <span className="font-medium">{s.count} / ${s.revenue.toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };
    const [isReloading, setIsReloading] = useState(false);
    useEffect(() => {
        const userInfo = localStorage.getItem("userInfo");
        if (userInfo) {
            try {
                const parsed = JSON.parse(userInfo);
                if ((parsed.role === "ADMIN" && !isAdmin) || (parsed.role !== "ADMIN" && isAdmin)) {
                    setIsReloading(true);
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }
            } catch {}
        }
    }, [isAdmin]);
    if (isReloading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="loader" /> {/* hoặc dùng Spinner component */}
                <span>Reloading, Please Wait....</span>
            </div>
        );
    }
    const location = useLocation();
    const [selectedTab, setSelectedTab] = useState<number>(location.state?.destination === "profile" ? 2 : (isAdmin ? 0 : 1));

    return (
        <div className="container">
            <Navbar />
            <div>
                <ul className="flex items-center flex-col xs:flex-row xs:space-x-8 sm:space-x-20 p-4 justify-center">
                    {isAdmin && (<li
                        className={`flex w-full xs:w-auto justify-center p-2 xs:px-4 items-center cursor-pointer transition-colors duration-200 ${
                            selectedTab === 0
                                ? "text-primary border-b border-primary"
                                : "text-secondary"
                        }`}
                        onClick={() => setSelectedTab(0)}
                    >
                        <BiSolidShoppingBags className="inline-block mr-1" />
                        <span>Products</span>
                    </li>)}
                    <li
                        className={`flex w-full xs:w-auto justify-center p-2 px-4 items-center cursor-pointer transition-colors duration-200 ${
                            selectedTab === 1
                                ? "text-primary border-b border-primary"
                                : "text-secondary"
                        }`}
                        onClick={() => setSelectedTab(1)}
                    >
                        <TbTruckDelivery className="inline-block mr-1" />
                        <span>Orders</span>
                    </li>
                    <li
                        className={`flex w-full xs:w-auto justify-center p-2 px-4 items-center cursor-pointer transition-colors duration-200 ${
                            selectedTab === 2
                                ? "text-primary border-b border-primary"
                                : "text-secondary"
                        }`}
                        onClick={() => setSelectedTab(2)}
                        data-cy="profile-btn"
                    >
                        <BiSolidUser className="inline-block mr-1" />
                        <span>Profile</span>
                    </li>
                </ul>
            </div>

                    {isAdmin && selectedTab === 0 && (
                        <>
                            <AdminOrdersStats token={token} />
                            <AdminProducts />
                        </>
                    )}
            {selectedTab === 1 && <Orders />}
            {selectedTab === 2 && <Profile />}
        </div>
    );
};
