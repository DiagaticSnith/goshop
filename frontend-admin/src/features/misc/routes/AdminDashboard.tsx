import React from "react";
import Navbar from "../../../components/Elements/Navbar";
import AdminProducts from "../../../features/products/components/AdminProducts";
import AdminOrdersDashboard from "../../../features/orders/components/AdminOrdersDashboard";
import { useAuth } from "../../../context/AuthContext";
import AdminUsers from "../../../features/users/components/AdminUsers";
import { useSearchParams } from "react-router-dom";
import { ManageCategories } from "../../../features/category";

export const AdminDashboard = () => {
	const { isAdmin } = useAuth();

	if (!isAdmin) {
		return (
			<div className="container">
				<Navbar />
				<div className="p-8">You don't have access to the admin dashboard.</div>
			</div>
		);
	}

	const [params, setParams] = useSearchParams();
	const tab = (params.get("tab") || "products").toLowerCase();
	// Ensure URL always has ?tab= for deep linking
	React.useEffect(() => {
		if (!params.get("tab")) {
			const next = new URLSearchParams(params);
			next.set("tab", "products");
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
				</div>

				{/* Panel */}
				{tab === "products" && (
					<section>
						<h3 className="font-semibold mb-2">Products</h3>
						<AdminProducts />
					</section>
				)}
				{tab === "users" && (
					<section>
						<h3 className="font-semibold mb-2">Users</h3>
						<AdminUsers />
					</section>
				)}
				{tab === "categories" && (
					<section>
						<h3 className="font-semibold mb-2">Categories</h3>
						<ManageCategories />
					</section>
				)}
				{tab === "orders" && (
					<section className="relative">
						<AdminOrdersDashboard />
					</section>
				)}
			</div>
		</div>
	);
};