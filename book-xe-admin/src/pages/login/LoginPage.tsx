import React, { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { supabase } from "../../app/supabase";
import { useAuth } from "../../app/auth-context";
import { Car, Loader2, Github } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  if (user && session) {
    return <Navigate to="/overview" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        navigate("/overview");
      }
    } catch (err) {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/overview`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(
        err.message || "Đã có lỗi xảy ra khi đăng nhập bằng " + provider,
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-200 mb-4 animate-bounce-subtle">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Chào mừng quay lại
          </h2>
          <p className="text-slate-500 mt-2">Hệ thống đặt xe nội bộ Công ty</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email công ty
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  className="input-field pl-12"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  className="input-field pl-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-lg border border-rose-100 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base shadow-lg shadow-blue-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang đăng nhập...
                </div>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-400">
                  Hoặc đăng nhập với
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSocialLogin("google")}
                disabled={loading}
                className="flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-slate-700 active:scale-95 shadow-sm group"
              >
                <svg
                  className="h-5 w-5 group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-sm">Google</span>
              </button>
              <button
                onClick={() => handleSocialLogin("github")}
                disabled={loading}
                className="flex items-center justify-center gap-3 px-4 py-2.5 bg-slate-900 border border-slate-900 rounded-xl hover:bg-slate-800 transition-all font-medium text-white active:scale-95 shadow-sm group"
              >
                <Github className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm">GitHub</span>
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-400">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-blue-600 font-medium hover:underline"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
