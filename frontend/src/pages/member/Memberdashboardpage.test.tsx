import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemberDashboardPage } from "./Memberdashboardpage";
import api from "../../lib/api";

// --- Mocks -----------------------------------------------------------

const mockUser = {
  id: 5,
  name: "Abebe Balcha",
  email: "abebe@example.com",
  username: "abebe",
  role: "member",
  sacco_id: 1,
  num_shares: 20,
};

vi.mock("../../stores/auth", () => ({
  useAuthStore: vi.fn(() => ({
    user: mockUser,
  })),
}));

// i18n: return the key itself, or interpolate {{vars}} naively, so
// assertions can target real key names without needing full i18next setup.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.name) return `Welcome back, ${opts.name}`;
      if (opts?.count !== undefined) return `${opts.count} active`;
      return key;
    },
  }),
}));

vi.mock("../../lib/api");

// --- Test data ---------------------------------------------------------

const mockSavings = {
  data: {
    balance: 145000,
    change_percent: 12,
    transactions: [
      {
        id: 1,
        type: "deposit",
        amount: 5000,
        balance_after: 145000,
        description: "Monthly Deposit",
        transaction_date: "2026-08-01",
        reference: "TRX-9821A",
        status: "completed",
      },
    ],
  },
};

const mockLoans = {
  data: {
    loans: [
      {
        id: 1,
        status: "approved",
        outstanding_balance: 45200.5,
        next_due_date: "2026-09-01",
        next_due_amount: 4500,
      },
    ],
  },
};

const mockProfile = {
  data: { sacco: { share_value: 1000 }, num_shares: 20 },
};

const mockDividends = {
  data: { total: 3450, change_percent: 5 },
};

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MemberDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// --- Tests ---------------------------------------------------------------

describe("MemberDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/me/savings") return Promise.resolve(mockSavings);
      if (url === "/me/loans") return Promise.resolve(mockLoans);
      if (url === "/profile") return Promise.resolve(mockProfile);
      if (url === "/me/dividends") return Promise.resolve(mockDividends);
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  });

  it("renders the page title and welcome subtitle", async () => {
    renderDashboard();
    expect(screen.getByText("member.dashboard.title")).toBeInTheDocument();
    expect(screen.getByText("Welcome back, Abebe Balcha")).toBeInTheDocument();
  });

  it("renders the savings balance once loaded", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("ETB 145,000")).toBeInTheDocument();
    });
  });

  it("renders outstanding loan total once loaded", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("ETB 45,200.5")).toBeInTheDocument();
    });
  });

  it("renders share capital as share_value * num_shares", async () => {
    renderDashboard();
    // share_value (1000) * num_shares (20) = 20,000
    await waitFor(() => {
      expect(screen.getByText("ETB 20,000")).toBeInTheDocument();
    });
  });

  it("renders total dividends once loaded", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("ETB 3,450")).toBeInTheDocument();
    });
  });

  it("shows the next installment due amount and a Pay Now link when a loan has one", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("ETB 4,500")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("link", { name: "member.dashboard.pay_now" }),
    ).toHaveAttribute("href", "/member/payments");
  });

  it("shows the no-installment-due message when no active loan has a due date", async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/me/savings") return Promise.resolve(mockSavings);
      if (url === "/me/loans") return Promise.resolve({ data: { loans: [] } });
      if (url === "/profile") return Promise.resolve(mockProfile);
      if (url === "/me/dividends") return Promise.resolve(mockDividends);
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    renderDashboard();
    await waitFor(() => {
      expect(
        screen.getByText("member.dashboard.no_installment_due"),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("link", { name: "member.dashboard.pay_now" }),
    ).not.toBeInTheDocument();
  });

  it("renders recent transactions with reference and status", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Monthly Deposit")).toBeInTheDocument();
    });
    expect(screen.getByText("TRX-9821A")).toBeInTheDocument();
    expect(
      screen.getByText("member.dashboard.status_completed"),
    ).toBeInTheDocument();
  });

  it("has Quick Actions links pointing to the right routes", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(
        screen.getByRole("link", {
          name: /member\.dashboard\.apply_for_loan/,
        }),
      ).toHaveAttribute("href", "/member/loans/apply");
    });
    expect(
      screen.getByRole("link", { name: /member\.dashboard\.view_savings/ }),
    ).toHaveAttribute("href", "/member/savings");
    expect(
      screen.getByRole("link", { name: /member\.dashboard\.edit_profile/ }),
    ).toHaveAttribute("href", "/member/profile");
  });
});
