import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, CircleAlert, Send, Calculator, Search, X } from "lucide-react";
import {
  applyForLoan,
  searchGuarantors,
  type ApplyForLoanRequest,
  type GuarantorSearchUser,
} from "@/services/memberLoanService";
import { useAuthStore } from "@/stores/auth";

interface LoanApplicationForm {
  amount: string;
  purpose: string;
  loan_type: string;
  term_months: string;
  agree_terms: boolean;
}

export default function ApplyLoan() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Guarantors State (Exactly 3 required when exceeding 3x limit)
  const [guarantorSearch, setGuarantorSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGuarantors, setSelectedGuarantors] = useState<GuarantorSearchUser[]>([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(guarantorSearch);
    }, 400);
    return () => clearTimeout(handler);
  }, [guarantorSearch]);

  const { data: guarantors, isLoading: isSearchingGuarantors } = useQuery({
    queryKey: ["guarantors", "search", debouncedSearch],
    queryFn: () => searchGuarantors(debouncedSearch),
    enabled: debouncedSearch.length > 2,
  });

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<LoanApplicationForm>({
    defaultValues: { amount: "", purpose: "", loan_type: "Personal", term_months: "12", agree_terms: false },
  });

  const amountValue = watch("amount");
  const termMonthsValue = watch("term_months");

  // Calculations
  const savingsBalance = user?.savings_balance ?? 0;
  const loanSavingsMultiplier = 3.0; // Standard 3x rule
  const maxAllowedWithoutGuarantor = savingsBalance * loanSavingsMultiplier;
  
  const principal = Number(amountValue) || 0;
  const months = Number(termMonthsValue) || 12;
  const requiresGuarantors = principal > maxAllowedWithoutGuarantor;

  const annualInterestRate = 0.12; // 12% standard
  const monthlyInterestRate = annualInterestRate / 12;
  const estimatedMonthly = principal > 0 
    ? (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, months)) / (Math.pow(1 + monthlyInterestRate, months) - 1) 
    : 0;
  const totalRepayable = estimatedMonthly * months;

  const addGuarantor = (g: GuarantorSearchUser) => {
    if (selectedGuarantors.length >= 3) {
      toast.error("You can select a maximum of 3 guarantors.");
      return;
    }
    if (selectedGuarantors.some(existing => existing.id === g.id)) {
      toast.error("Guarantor already selected.");
      return;
    }
    if (g.id === user?.id) {
      toast.error("You cannot select yourself as a guarantor.");
      return;
    }
    setSelectedGuarantors([...selectedGuarantors, g]);
    setGuarantorSearch("");
  };

  const removeGuarantor = (id: number) => {
    setSelectedGuarantors(selectedGuarantors.filter(g => g.id !== id));
  };

  const mutation = useMutation({
    mutationFn: (request: ApplyForLoanRequest) => applyForLoan(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["member", "loans"] });
      toast.success(t("member.apply_loan.success") || "Loan application submitted successfully!");
      navigate("/member/loans");
    },
    onError: (error) => {
      const fallbackMessage = t("member.apply_loan.submit_error") || "Failed to submit loan application.";
      setSubmissionError(fallbackMessage);

      if (!isAxiosError(error)) return;

      const responseData = error.response?.data as
        | { message?: string; errors?: Record<string, string[]> }
        | undefined;
      setSubmissionError(responseData?.message ?? fallbackMessage);

      const fieldErrors = responseData?.errors;
      if (fieldErrors?.amount?.[0]) setError("amount", { type: "server", message: fieldErrors.amount[0] });
      if (fieldErrors?.purpose?.[0]) setError("purpose", { type: "server", message: fieldErrors.purpose[0] });
    },
  });

  const onSubmit = (formData: LoanApplicationForm) => {
    setSubmissionError(null);
    const amount = Number(formData.amount);
    const term_months = Number(formData.term_months);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("amount", { type: "validate", message: t("member.apply_loan.amount_invalid") || "Invalid amount" });
      return;
    }
    
    if (requiresGuarantors) {
      if (selectedGuarantors.length !== 3) {
        setSubmissionError(`The requested loan amount exceeds 3x your savings (ETB ${maxAllowedWithoutGuarantor.toLocaleString(undefined, {minimumFractionDigits: 2})}). You MUST select EXACTLY 3 guarantors to submit this application.`);
        return;
      }
    }

    if (!formData.agree_terms) {
      setSubmissionError("You must agree to the terms and conditions.");
      return;
    }

    const purpose = formData.purpose.trim();
    if (!purpose) {
      setError("purpose", { type: "validate", message: t("member.apply_loan.purpose_required") || "Required" });
      return;
    }

    mutation.mutate({ 
      amount, 
      purpose, 
      loan_type: formData.loan_type,
      term_months,
      guarantor_ids: requiresGuarantors ? selectedGuarantors.map(g => g.id) : undefined
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/member/loans" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("member.apply_loan.back_to_loans") || "Back to Loans"}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
          {t("member.apply_loan.title") || "Apply for a Loan"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Complete the application below. Ensure you review the estimated repayment schedule before submitting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Loan Product <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("loan_type")}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition-colors focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="Personal">Personal Loan</option>
                  <option value="Emergency">Emergency Loan</option>
                  <option value="Development">Development Loan</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Repayment Duration <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("term_months")}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition-colors focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months (1 Year)</option>
                  <option value="24">24 Months (2 Years)</option>
                  <option value="36">36 Months (3 Years)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="loan-amount" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Amount Requested <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-medium text-slate-500 dark:text-slate-400">ETB</span>
                <input
                  id="loan-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  aria-invalid={Boolean(errors.amount)}
                  className={`w-full rounded-lg border bg-white py-2.5 pl-14 pr-3 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:bg-slate-950 dark:text-white ${errors.amount ? "border-rose-500" : "border-slate-300 dark:border-slate-700"}`}
                  placeholder="0.00"
                  {...register("amount", {
                    required: "Amount is required",
                    validate: (value) => Number(value) > 0 || "Invalid amount",
                  })}
                />
              </div>
              {errors.amount && <p className="mt-1.5 text-sm text-rose-600 dark:text-rose-400">{errors.amount.message}</p>}
              
              <div className="mt-2 text-xs text-slate-500 flex justify-between">
                <span>Your Savings: ETB {savingsBalance.toLocaleString()}</span>
                <span>Max 3x Limit (No Guarantor): ETB {maxAllowedWithoutGuarantor.toLocaleString()}</span>
              </div>
            </div>

            {requiresGuarantors && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                    3 Guarantors Required
                  </h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedGuarantors.length === 3 ? "bg-emerald-100 text-emerald-800" : "bg-amber-200 text-amber-900"}`}>
                    {selectedGuarantors.length} / 3 Selected
                  </span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Your requested loan amount exceeds your 3x savings limit (ETB {maxAllowedWithoutGuarantor.toLocaleString()}). You must select <strong>EXACTLY 3 guarantors</strong> from your SACCO.
                </p>

                {/* Selected Guarantors List */}
                <div className="space-y-2">
                  {selectedGuarantors.map((g, index) => (
                    <div key={g.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-md border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 text-emerald-600 rounded-full p-1 text-xs font-bold w-6 h-6 flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{g.name}</p>
                          <p className="text-xs text-slate-500">{g.email} • ID: {g.national_id || 'N/A'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGuarantor(g.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="Remove guarantor"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Search Bar for adding guarantors */}
                {selectedGuarantors.length < 3 && (
                  <div className="relative pt-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder={`Search and add Guarantor #${selectedGuarantors.length + 1}...`}
                        value={guarantorSearch}
                        onChange={(e) => setGuarantorSearch(e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      />
                    </div>
                    
                    {debouncedSearch.length > 2 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700 max-h-48 overflow-y-auto">
                        {isSearchingGuarantors ? (
                          <div className="p-3 text-xs text-slate-500 text-center">Searching...</div>
                        ) : guarantors && guarantors.length > 0 ? (
                          <ul className="py-1">
                            {guarantors
                              .filter(g => !selectedGuarantors.some(sel => sel.id === g.id) && g.id !== user?.id)
                              .map((g) => (
                                <li key={g.id}>
                                  <button
                                    type="button"
                                    onClick={() => addGuarantor(g)}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-slate-700 flex flex-col"
                                  >
                                    <span className="font-medium text-slate-900 dark:text-white">{g.name}</span>
                                    <span className="text-xs text-slate-500">{g.email} • ID: {g.national_id || 'N/A'}</span>
                                  </button>
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <div className="p-3 text-xs text-slate-500 text-center">No eligible members found.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <label htmlFor="loan-purpose" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Loan Purpose <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="loan-purpose"
                rows={3}
                aria-invalid={Boolean(errors.purpose)}
                className={`mt-2 w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:bg-slate-950 dark:text-white ${errors.purpose ? "border-rose-500" : "border-slate-300 dark:border-slate-700"}`}
                placeholder="Briefly describe why you need this loan..."
                {...register("purpose", {
                  required: "Purpose is required",
                })}
              />
              {errors.purpose && <p className="mt-1.5 text-sm text-rose-600 dark:text-rose-400">{errors.purpose.message}</p>}
            </div>

            <div className="flex items-start gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex h-6 items-center">
                <input
                  id="agree_terms"
                  type="checkbox"
                  {...register("agree_terms")}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 dark:border-slate-600 dark:bg-slate-800"
                />
              </div>
              <label htmlFor="agree_terms" className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                I agree to the SACCO's Loan Policies, including the interest rate terms, and authorize the automatic deduction of monthly installments from my payroll/account.
              </label>
            </div>

            {submissionError && (
              <div role="alert" className="mt-5 flex gap-2 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                <CircleAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
                <p>{submissionError}</p>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link to="/member/loans" className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Cancel
              </Link>
              <button type="submit" disabled={mutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
                <Send className="h-4 w-4" aria-hidden="true" />
                {mutation.isPending ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>

        {/* Calculator Widget */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 dark:border-emerald-900/30 dark:bg-emerald-950/20 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">Repayment Preview</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Estimated Installment</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  ETB {estimatedMonthly.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  <span className="text-sm font-normal text-slate-500 ml-1">/mo</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-200/50 dark:border-emerald-800/50">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Total Interest</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-200">
                    ETB {(totalRepayable - principal).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Total Repayable</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-200">
                    ETB {totalRepayable.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-500 mt-2">
                * Calculation based on standard {annualInterestRate * 100}% annual interest rate over {months} months. Actual approved rates may vary.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
