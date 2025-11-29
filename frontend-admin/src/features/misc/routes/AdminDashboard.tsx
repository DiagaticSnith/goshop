import React from "react";
import Navbar from "../../../components/Elements/Navbar";
import AdminProducts from "../../../features/products/components/AdminProducts";
import AdminOrdersDashboard from "../../../features/orders/components/AdminOrdersDashboard";
import Overview from "../components/Overview";
import { useAuth } from "../../../context/AuthContext";
import AdminUsers from "../../../features/users/components/AdminUsers";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ManageCategories } from "../../../features/category";

export const AdminDashboard = () => {
	const { isAdmin, token } = useAuth();

	const navigate = useNavigate();

	React.useEffect(() => {
		if (isAdmin === false) {
			navigate("/auth/login", { replace: true });
		}
	}, [isAdmin, navigate]);

	if (isAdmin === undefined) {
		return <div className="container"><Navbar /><div className="p-8">Loading...</div></div>;
	}
	if (isAdmin === false) {
		return null;
	}

	const [params, setParams] = useSearchParams();
	const tab = (params.get("tab") || "overview").toLowerCase();
	// Ensure URL always has ?tab= for deep linking
	React.useEffect(() => {
		if (!params.get("tab")) {
			const next = new URLSearchParams(params);
			next.set("tab", "overview");
			setParams(next, { replace: true });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const setTab = (t: string) => {
		const next = new URLSearchParams(params);
		next.set("tab", t);
		setParams(next, { replace: true });
	};

	const isActive = (t: string) => (tab === t ? "bg-primary text-white" : "bg-gray-100 text-dark");

	return (
		<div className="container">
			<Navbar />
			<div className="mt-6 bg-white rounded-md shadow-sm p-4">
				<h2 className="text-2xl font-semibold mb-4">Admin Dashboard</h2>

				{/* Tabs */}
				<div className="flex gap-2 mb-4">
					<button className={`px-3 py-1 rounded ${isActive("overview")}`} onClick={() => setTab("overview")}>
						Overview
					</button>
					<button className={`px-3 py-1 rounded ${isActive("products")}`} onClick={() => setTab("products")}>
						Products
					</button>
					<button className={`px-3 py-1 rounded ${isActive("categories")}`} onClick={() => setTab("categories")}>
						Categories
					</button>
					<button className={`px-3 py-1 rounded ${isActive("users")}`} onClick={() => setTab("users")}>
						Users
					</button>
					<button className={`px-3 py-1 rounded ${isActive("orders")}`} onClick={() => setTab("orders")}>
						Orders
					</button>
					{/* Reports tab removed per UX request */}
				</div>

				{/* Panel */}
				{tab === "overview" && (
					<section>
						<Overview />
					</section>
				)}
				{tab === "products" && (
					<section>
						<AdminProducts />
					</section>
				)}
				{tab === "users" && (
					<section>
						<AdminUsers />
					</section>
				)}
				{tab === "categories" && (
					<section>
						<ManageCategories />
					</section>
				)}
				{tab === "orders" && (
					<section className="relative">
						<AdminOrdersDashboard />
					</section>
				)}
				{/* Reports tab removed: reporting is now available inside Overview */}
			</div>
		</div>
	);
};