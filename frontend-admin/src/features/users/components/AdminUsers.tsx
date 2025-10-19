import React from "react";
import { useAuth } from "../../../context/AuthContext";
import { listUsers, toggleUserStatus, updateUserRole } from "../api/adminUsers";
import * as userApi from "../api/updateUser";
import { toast } from "react-toastify";

const AdminUsers: React.FC = () => {
	const { token, isAdmin } = useAuth();
	const [q, setQ] = React.useState("");
	const [includeHidden, setIncludeHidden] = React.useState(true);
	const [users, setUsers] = React.useState<IUser[]>([]);
	const [loading, setLoading] = React.useState(false);

	const fetchUsers = React.useCallback(async () => {
		if (!token || !isAdmin) return;
		setLoading(true);
		try {
			const data = await listUsers(token, q || undefined, includeHidden);
			setUsers(data);
		} finally {
			setLoading(false);
		}
	}, [token, isAdmin, q, includeHidden]);

	React.useEffect(() => { fetchUsers(); }, [fetchUsers]);

	const onToggle = async (u: IUser) => {
		if (!token) return;
		try {
			const updated = await toggleUserStatus(token, u.firebaseId);
			setUsers(prev => prev.map(x => x.firebaseId === u.firebaseId ? updated : x));
		} catch {
			toast.error('Cannot lock/unlock this user');
		}
	};

	const onChangeRole = async (u: IUser, role: "USER" | "ADMIN") => {
		if (!token) return;
		try {
			const updated = await updateUserRole(token, u.firebaseId, role);
			setUsers(prev => prev.map(x => x.firebaseId === u.firebaseId ? updated : x));
		} catch {
			toast.error('Failed to update role');
		}
	};

	const admins = users.filter(u => u.role === 'ADMIN');
	const regularUsers = users.filter(u => u.role !== 'ADMIN');

	return (
		<div className="bg-white rounded-md drop-shadow-custom p-4">
			<div className="flex items-center gap-2 mb-4">
				<input
					value={q}
					onChange={e => setQ(e.target.value)}
					placeholder="Search by name or email"
					className="px-3 py-2 border rounded-md w-64"
				/>
				<label className="flex items-center gap-2 text-sm">
					<input type="checkbox" checked={includeHidden} onChange={e => setIncludeHidden(e.target.checked)} /> Include hidden
				</label>
				<button onClick={fetchUsers} className="px-3 py-2 border rounded-md">Refresh</button>
			</div>

			{loading && <div>Loading users...</div>}
			{!loading && (
				<div className="space-y-8">
					{/* Admins section (read-only) */}
					<div>
						<h4 className="font-semibold mb-2">Admins</h4>
						<div className="overflow-auto">
							<table className="min-w-full text-left text-sm">
								<thead>
									<tr className="border-b text-secondary">
										<th className="py-2 px-2">Avatar</th>
										<th className="py-2 px-2">Full name</th>
										<th className="py-2 px-2">Email</th>
										<th className="py-2 px-2">Role</th>
										<th className="py-2 px-2">Status</th>
										<th className="py-2 px-2 text-right">Actions</th>
									</tr>
								</thead>
								<tbody>
									{admins.map(u => (
										<tr key={u.firebaseId} className="border-b">
											<td className="py-2 px-2">
												<img src={typeof u.avatar === 'string' ? u.avatar : ''} alt="avatar" className="w-8 h-8 rounded-full object-cover"/>
											</td>
											<td className="py-2 px-2 font-medium">{u.fullName}</td>
											<td className="py-2 px-2">{u.email}</td>
											<td className="py-2 px-2">ADMIN</td>
											<td className="py-2 px-2">
												<span className={`px-2 py-1 rounded text-xs ${u.status === 'HIDDEN' ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'}`}>
													{(u.status || 'ACTIVE').toLowerCase()}
												</span>
											</td>
											<td className="py-2 px-2 text-right">
												{/* No actions for admins */}
											</td>
										</tr>
									))}
									{admins.length === 0 && (
										<tr>
											<td colSpan={6} className="py-4 text-center text-secondary">No admins</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>

					{/* Users section (with actions) */}
					<div>
						<h4 className="font-semibold mb-2">Users</h4>
						<div className="overflow-auto">
							<table className="min-w-full text-left text-sm">
								<thead>
									<tr className="border-b text-secondary">
										<th className="py-2 px-2">Avatar</th>
										<th className="py-2 px-2">Full name</th>
										<th className="py-2 px-2">Email</th>
										<th className="py-2 px-2">Role</th>
										<th className="py-2 px-2">Status</th>
										<th className="py-2 px-2 text-right">Actions</th>
									</tr>
								</thead>
								<tbody>
									{regularUsers.map(u => (
										<tr key={u.firebaseId} className="border-b">
											<td className="py-2 px-2">
												<img src={typeof u.avatar === 'string' ? u.avatar : ''} alt="avatar" className="w-8 h-8 rounded-full object-cover"/>
											</td>
											<td className="py-2 px-2 font-medium">{u.fullName}</td>
											<td className="py-2 px-2">{u.email}</td>
											<td className="py-2 px-2">
												<select value={u.role} onChange={e => onChangeRole(u, e.target.value as any)} className="border rounded px-2 py-1">
													<option value="USER">USER</option>
													<option value="ADMIN">ADMIN</option>
												</select>
											</td>
											<td className="py-2 px-2">
												<span className={`px-2 py-1 rounded text-xs ${u.status === 'HIDDEN' ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'}`}>
													{(u.status || 'ACTIVE').toLowerCase()}
												</span>
											</td>
											<td className="py-2 px-2 text-right">
												<div className="flex items-center justify-end gap-2">
													<button onClick={() => onToggle(u)} className="px-3 py-1 border rounded">
														{u.status === 'HIDDEN' ? 'Unlock' : 'Lock'}
													</button>
													<EditUserButton user={u} onUpdated={(nu)=> setUsers(prev => prev.map(x => x.firebaseId===nu.firebaseId?nu:x))} />
												</div>
											</td>
										</tr>
									))}
									{regularUsers.length === 0 && (
										<tr>
											<td colSpan={6} className="py-4 text-center text-secondary">No users</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

// naive split helpers: last word as lastName, rest as firstName
const splitName = (full: string) => {
	const parts = (full || '').trim().split(/\s+/);
	if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' };
	const lastName = parts.pop() || '';
	const firstName = parts.join(' ');
	return { firstName, lastName };
};

const EditUserButton: React.FC<{ user: IUser; onUpdated: (u: IUser)=>void }> = ({ user, onUpdated }) => {
	const { token } = useAuth();
	const [open, setOpen] = React.useState(false);
	const initial = React.useMemo(() => splitName(user.fullName || ''), [user.fullName]);
	const [firstName, setFirstName] = React.useState(initial.firstName);
	const [lastName, setLastName] = React.useState(initial.lastName);
	const [avatar, setAvatar] = React.useState<File | null>(null);

	const onSave = async () => {
		if (!token) return;
		const form = new FormData();
		form.append('firstName', firstName);
		form.append('lastName', lastName);
		if (avatar) form.append('avatar', avatar);
		const updated = await userApi.updateUser(user.firebaseId, form, token);
		onUpdated(updated.user as any);
		setOpen(false);
	};

	return (
		<>
			<button onClick={() => setOpen(true)} className="px-3 py-1 border rounded">Edit</button>
			{open && (
				<div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
					<div className="bg-white rounded-md p-4 w-[360px]">
						<h3 className="font-semibold mb-3">Edit user</h3>
						<div className="space-y-2">
							<div>
								<label className="text-sm">First name</label>
								<input value={firstName} onChange={e=>setFirstName(e.target.value)} className="w-full border rounded px-2 py-1" />
							</div>
							<div>
								<label className="text-sm">Last name</label>
								<input value={lastName} onChange={e=>setLastName(e.target.value)} className="w-full border rounded px-2 py-1" />
							</div>
							<div>
								<label className="text-sm">Avatar</label>
								<input type="file" accept="image/*" onChange={e=>setAvatar(e.target.files?.[0] || null)} />
							</div>
						</div>
						<div className="mt-4 flex justify-end gap-2">
							<button onClick={()=>setOpen(false)} className="px-3 py-1 border rounded">Cancel</button>
							<button onClick={onSave} className="px-3 py-1 bg-primary text-white rounded">Save</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default AdminUsers;
