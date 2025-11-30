interface IUser {
  firebaseId: string;
  email: string;
  fullName: string;
  role: "USER" | "ADMIN";
  status?: "ACTIVE" | "HIDDEN";
  avatar?: string | Blob;
  // optional profile fields
  phoneNumber?: string | null;
  address?: string | null;
}
