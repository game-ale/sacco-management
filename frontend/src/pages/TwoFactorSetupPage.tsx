import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  ShieldCheck, 
  ArrowRight, 
  Key, 
  Copy, 
  Download, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { useAuthStore } from "../stores/auth";
import { authService } from "../services/authService";

export const TwoFactorSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, getProfile } = useAuthStore();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [password, setPassword] = useState("");
  const [setupData, setSetupData] = useState<{ secret: string; qr_code_url: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If user already has 2FA enabled, redirect them back
  if (user?.two_factor_confirmed_at) {
    navigate(-1);
    return null;
  }

  const handleStartSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter your password to continue.");
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await authService.enableTwoFactor(password);
      setSetupData(data.data);
      setStep(2);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to start 2FA setup. Check your password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

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

  const handleConfirmSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    
    if (fullCode.length !== 6) {
      toast.error("Please enter the 6-digit code.");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await authService.confirmTwoFactor(fullCode);
      setRecoveryCodes(response.data.recovery_codes);
      await getProfile(); // Refresh user state to show 2FA as enabled
      setStep(3);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid code. Please try again.");
      setCode(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const downloadRecoveryCodes = () => {
    const element = document.createElement("a");
    const file = new Blob(
      [`SACCO Manager 2FA Recovery Codes\nGenerated on: ${new Date().toLocaleString()}\n\n${recoveryCodes.join('\n')}\n\nKeep these secure. Each code can only be used once.`], 
      {type: 'text/plain'}
    );
    element.href = URL.createObjectURL(file);
    element.download = "sacco-recovery-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    toast.success("Recovery codes copied to clipboard!");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          ← Back to Settings
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Set Up Two-Factor Authentication
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Add an extra layer of security to your account.
            </p>
          </div>
        </div>

        <div className="p-8">
          {/* STEP 1: VERIFY PASSWORD */}
          {step === 1 && (
            <form onSubmit={handleStartSetup} className="max-w-md mx-auto space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Key className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Verify it's you
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  To begin the setup process, please confirm your current password.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0B6B3A] focus:border-[#0B6B3A] outline-none transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full py-3 bg-[#0B6B3A] hover:bg-[#08522c] text-white rounded-xl font-bold shadow-sm disabled:opacity-50 transition-all flex justify-center items-center gap-2"
              >
                {isLoading ? "Verifying..." : "Continue"}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* STEP 2: SCAN QR AND ENTER CODE */}
          {step === 2 && setupData && (
            <div className="max-w-xl mx-auto space-y-8">
              <div className="flex gap-4">
                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#0B6B3A] text-white font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Scan the QR Code
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    Open your authenticator app (like Google Authenticator, Authy, or Microsoft Authenticator) and scan this QR code.
                  </p>
                  
                  <div className="bg-white p-4 inline-block rounded-xl border border-slate-200 shadow-sm mb-4">
                    <img 
                      src={setupData.qr_code_url} 
                      alt="2FA QR Code" 
                      className="w-48 h-48"
                    />
                  </div>
                  
                  <div className="text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Can't scan the QR code? Enter this key manually:</span>
                    <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-sm break-all text-slate-900 dark:text-white flex items-center justify-between group">
                      {setupData.secret}
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(setupData.secret);
                          toast.success("Secret copied to clipboard!");
                        }}
                        className="text-slate-400 hover:text-[#0B6B3A] transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#0B6B3A] text-white font-bold text-sm">
                  2
                </div>
                <div className="w-full">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Verify Code
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    Enter the 6-digit code generated by your app to verify the setup.
                  </p>
                  
                  <form onSubmit={handleConfirmSetup}>
                    <div className="flex gap-2 mb-6 max-w-sm">
                      {code.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { inputRefs.current[index] = el }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleCodeChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={handlePaste}
                          className="w-12 h-14 text-center text-xl font-bold bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#0B6B3A] focus:border-[#0B6B3A] dark:text-white transition-all outline-none"
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || code.join("").length !== 6}
                      className="py-3 px-6 bg-[#0B6B3A] hover:bg-[#08522c] text-white rounded-xl font-bold shadow-sm disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                    >
                      {isLoading ? "Verifying..." : "Confirm & Enable"}
                      {!isLoading && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RECOVERY CODES */}
          {step === 3 && (
            <div className="max-w-xl mx-auto text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                2FA Enabled Successfully!
              </h3>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl text-left flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-500 mb-1">Save your recovery codes</h4>
                  <p className="text-sm text-amber-800 dark:text-amber-400/80">
                    If you lose access to your device, these codes are the ONLY way to access your account. Download or copy them now and store them somewhere safe.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-sm text-left">
                {recoveryCodes.map((code, index) => (
                  <div key={index} className="text-slate-900 dark:text-white tracking-widest">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy Codes
                </button>
                <button
                  onClick={downloadRecoveryCodes}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Codes
                </button>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => navigate(-1)}
                  className="w-full py-3 bg-[#0B6B3A] hover:bg-[#08522c] text-white rounded-xl font-bold shadow-sm transition-all"
                >
                  I have saved my codes — Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
