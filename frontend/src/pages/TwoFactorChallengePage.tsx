import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useAuthStore } from "../stores/auth";
import { authService } from "../services/authService";

export const TwoFactorChallengePage: React.FC = () => {
  const navigate = useNavigate();
  const { twoFactorToken, clearTwoFactorState, isTwoFactorPending } = useAuthStore();

  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [recoveryCode, setRecoveryCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isTwoFactorPending || !twoFactorToken) {
      navigate("/login");
    }
  }, [isTwoFactorPending, twoFactorToken, navigate]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple chars

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && code[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pastedData) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      if (pastedData.length === 6) {
        inputRefs.current[5]?.focus();
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullCode = code.join("");
    
    if (useRecoveryCode && !recoveryCode.trim()) {
      toast.error("Please enter a recovery code.");
      return;
    }
    
    if (!useRecoveryCode && fullCode.length !== 6) {
      toast.error("Please enter the 6-digit code.");
      return;
    }

    if (!twoFactorToken) return;

    setIsLoading(true);
    try {
      const response = await authService.challengeTwoFactor({
        two_factor_token: twoFactorToken,
        code: !useRecoveryCode ? fullCode : undefined,
        recovery_code: useRecoveryCode ? recoveryCode.trim() : undefined,
        remember_device: true // Always true for simplicity, or we can add a checkbox
      });

      // Clear pending state
      clearTwoFactorState();
      
      // Complete login
      const { user, access_token, two_factor_remember_token } = response.data;
      
      localStorage.setItem("token", access_token);
      
      // Store remember token in cookie (or localStorage for simplicity in this SPA)
      if (two_factor_remember_token) {
        // We'd ideally set this as a secure cookie from the backend, 
        // but for this SPA pattern we'll just let the backend handle the cookie 
        // via the API response headers if configured, or we pass it in future requests.
        // For now, setting it in localStorage is a fallback if cookies aren't used.
        localStorage.setItem("2fa_remember_token", two_factor_remember_token);
      }
      
      useAuthStore.setState({ 
        user, 
        token: access_token, 
        isAuthenticated: true 
      });

      toast.success("Authentication successful");

      if (user.role === "superadmin") {
        navigate("/super-admin");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "member") {
        navigate("/member");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Invalid authentication code.";
      toast.error(message);
      setCode(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-[#0B6B3A]/10 p-3 rounded-2xl">
            <ShieldCheck className="w-10 h-10 text-[#0B6B3A] dark:text-emerald-500" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Two-Factor Authentication
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          {!useRecoveryCode 
            ? "Enter the 6-digit code from your authenticator app."
            : "Enter one of your emergency recovery codes."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!useRecoveryCode ? (
              <div>
                <div className="flex justify-between items-center gap-2 mb-6">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0B6B3A] focus:border-[#0B6B3A] dark:text-white transition-all outline-none"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Recovery Code
                </label>
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder="e.g. a1b2c3d4e5-f6g7h8i9j0"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0B6B3A] focus:border-[#0B6B3A] dark:text-white transition-all outline-none font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (!useRecoveryCode && code.join("").length !== 6) || (useRecoveryCode && !recoveryCode)}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#0B6B3A] hover:bg-[#08522c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B6B3A] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? "Verifying..." : "Verify & Sign In"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
              <button
                type="button"
                onClick={() => {
                  setUseRecoveryCode(!useRecoveryCode);
                  setCode(Array(6).fill(""));
                  setRecoveryCode("");
                }}
                className="text-sm font-medium text-slate-500 hover:text-[#0B6B3A] dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
              >
                {!useRecoveryCode
                  ? "Lost device? Use a recovery code"
                  : "Use an authenticator app instead"}
              </button>
            </div>
            
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => {
                   clearTwoFactorState();
                   navigate('/login');
                }}
                className="text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Cancel & Return to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
