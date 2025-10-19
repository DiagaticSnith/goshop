import Navbar from "../../../components/Elements/Navbar";
import LoginForm from "../components/LoginForm";

export default function LoginPage(){
  return (
    <div className="container">
      <Navbar />
      <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded-md drop-shadow-custom">
        <h2 className="text-xl font-semibold mb-4">Sign in</h2>
        <LoginForm />
      </div>
    </div>
  );
}
