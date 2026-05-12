import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const Signup = () => {
  const { setIsLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

  const isFormValid =
    formData.name.trim() &&
    formData.email.trim() &&
    formData.email.includes("@") &&
    formData.password.length >= 6 &&
    formData.password === formData.confirmPassword;

  const validateForm = () => {
    let newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!formData.email.includes("@")) {
      newErrors.email = "Invalid email.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    return Object.keys(newErrors).length ? newErrors : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          server: data.error || "Signup failed",
        });

        setLoading(false);
        return;
      }

      console.log(data);

      setIsLoggedIn(true);

      navigate("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);
      setErrors({ server: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10 bg-main">
      <section className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-default bg-white dark:bg-secondary shadow-lg">
        <div className="grid md:grid-cols-2">

          {/* LEFT SIDE */}
          <div className="bg-primary text-white flex flex-col items-center justify-center px-8 py-16 text-center md:rounded-r-[120px] shadow-lg">
            <h2 className="text-3xl font-bold">Create Account</h2>

            <p className="mt-3 max-w-sm text-sm text-white/80">
              Join DataFlow and start transforming messy data into insights.
            </p>

            <p className="mt-8 text-sm text-white/80">
              Already have an account?
            </p>

            <Link
              to="/login"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold hover:bg-white/20 transition"
            >
              Login
            </Link>
          </div>

          {/* RIGHT SIDE */}
          <div className="px-8 py-12 sm:px-12 md:px-14">
            <div className="mx-auto max-w-md">
              <h1 className="text-3xl font-bold text-muted text-center">Sign Up</h1>

              <p className="text-muted text-center mt-3">
                Create your DataFlow account
              </p>

              <form onSubmit={handleSubmit} className="mt-10 space-y-5">

                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-medium">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="input"
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-medium">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="input"
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-medium">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="input"
                  />
                  {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-medium">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    placeholder="Confirm password"
                    onChange={handleChange}
                    className="input"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="w-full btn btn-primary py-3 rounded-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>

              </form>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
};

export default Signup;