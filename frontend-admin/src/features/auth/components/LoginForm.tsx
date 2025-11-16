import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "react-toastify";
import { useState } from "react";
import { useSessionLoginMutation } from "../api/login";
import { Spinner } from "../../../components/Elements/Spinner";

const loginValidationSchema = yup.object({
  email: yup.string().email("Please enter a valid email address").required("Email is required"),
  password: yup.string().required("Password is required").matches(/^\S*$/, "Password cannot contain spaces"),
});

type LoginFormValues = yup.InferType<typeof loginValidationSchema>;

export default function LoginForm(){
  const { mutateAsync: sessionLogin } = useSessionLoginMutation();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginFormValues>({ resolver: yupResolver(loginValidationSchema) });
  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      const email = data.email.trim();
      const password = data.password;
      const userCredentials = await signIn(email, password);
      if (userCredentials) {
        const idToken = await userCredentials.user.getIdToken();
        const userInfo = await sessionLogin(idToken);
        try { localStorage.removeItem("cart"); } catch(e) {}
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
        if (userInfo?.role !== 'ADMIN') {
          // Fake invalid credentials for non-admin
          await signOut();
          throw new Error('Invalid credentials');
        }
  // Force a full reload to ensure auth/role is applied before route guards
  window.location.assign("/admin?tab=overview");
      }
    } catch (error) {
      toast.error("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccount = () => {
    setValue("email", "bobsmith@gmail.com");
    setValue("password", "Password@123");
  };

  return (
    <>
      <form className="w-full relative" onSubmit={handleSubmit(onSubmit)}>
        {isLoading && <Spinner />}
        <div className="flex flex-col mb-4">
          <label htmlFor="email" className="text-secondary">Email Address</label>
          <input {...register("email")} type="email" id="email" placeholder="Enter Email Address" className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-1 border focus:border-primary focus:bg-white focus:outline-none" />
          <p className="text-red-500 font-semibold mt-1">{errors.email?.message}</p>
        </div>
        <div className="flex flex-col mb-1">
          <label htmlFor="password" className="text-secondary">Password</label>
          <input {...register("password")} type="password" id="password" placeholder="Enter Password" className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-1 border focus:border-primary focus:bg-white focus:outline-none" />
          <p className="text-red-500 font-semibold mt-1">{errors.password?.message}</p>
        </div>
        <div className="mb-10 text-right">
          <span className="text-sm font-semibold text-secondary">&nbsp;</span>
        </div>
        <button className="w-full font-semibold text-sm bg-dark text-white transition hover:bg-opacity-90 rounded-xl py-3 px-4 mb-2">Sign In</button>
        <button type="button" className="w-full font-semibold text-sm bg-gray-100 text-dark transition-colors hover:bg-gray-200 rounded-xl py-3 px-4" onClick={handleDemoAccount}>Use Demo Account</button>
      </form>
    </>
  );
}
