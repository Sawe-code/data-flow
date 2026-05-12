import { Link, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors({});
  };

  const validateForm = () => {
    let newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!formData.email.includes("@")) {
      newErrors.email = "Invalid email.";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    return Object.keys(newErrors).length ? newErrors : null;
  };

  const isFormValid =
    formData.email.trim() &&
    formData.email.includes("@") &&
    formData.password.trim() &&
    formData.password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          general: data.error || "Login failed.",
        });

        return;
      }

      console.log(data);

      // SAVE JWT TOKEN
      localStorage.setItem("token", data.token);

      // LOGIN STATE
      setIsLoggedIn(true);

      // REDIRECT
      navigate("/dashboard");

    } catch (err) {
      console.error(err);

      setErrors({
        general: "Server error. Please try again.",
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10 bg-main">
      <section className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-default bg-white dark:bg-secondary shadow-lg">
        <div className="grid md:grid-cols-2">


          <div className="bg-primary text-white flex flex-col items-center justify-center px-8 py-16 text-center md:rounded-r-[120px] shadow-lg">
            <h2 className="text-3xl font-bold">Welcome Back</h2>

            <p className="mt-3 max-w-sm text-sm text-white/80">
              Access your dashboards, clean your data, and generate insights instantly.
            </p>

            <p className="mt-8 text-sm text-white/80">
              Don’t have an account?
            </p>

            <Link
              to="/signup"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold hover:bg-white/20 transition"
            >
              Sign Up
            </Link>
          </div>


          <div className="px-8 py-12 sm:px-12 md:px-14">
            <div className="mx-auto max-w-md">
              <h1 className="text-3xl text-muted font-bold text-center">Login</h1>

              <p className="text-muted text-center mt-3">
                Sign in to your DataFlow account
              </p>

              <form onSubmit={handleSubmit} className="mt-10 space-y-5">


                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-bold">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="input"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>


                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-bold">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="input"
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>


                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                {errors.general && (
                  <p className="text-sm text-red-500 text-center">
                    {errors.general}
                  </p>
                )}


                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="w-full btn btn-primary py-3 rounded-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

              </form>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
};

export default Login;