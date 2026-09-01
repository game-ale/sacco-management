import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { MemberLayout } from "./Memberlayout";
import { useAuthStore } from "../../stores/auth";

vi.mock("../../stores/auth", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("../../components/ThemeToggle", () => ({
  default: () => <button data-testid="theme-toggle">Theme</button>,
}));

vi.mock("../../components/LanguageSwitcher", () => ({
  LanguageSwitcher: () => <button data-testid="lang-switcher">Lang</button>,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function renderAtMember() {
  const router = createMemoryRouter(
    [
      {
        path: "/member",
        element: <MemberLayout />,
        children: [{ index: true, element: <div>Dashboard Content</div> }],
      },
      { path: "/login", element: <div>Login Page</div> },
      { path: "/unauthorized", element: <div>Unauthorized Page</div> },
    ],
    { initialEntries: ["/member"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("MemberLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when there is no authenticated user", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      logout: vi.fn(),
    } as ReturnType<typeof useAuthStore>);

    renderAtMember();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("redirects to /unauthorized when the user's role is not member", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 2, name: "Sacco Admin", role: "admin" },
      logout: vi.fn(),
    } as ReturnType<typeof useAuthStore>);

    renderAtMember();
    expect(screen.getByText("Unauthorized Page")).toBeInTheDocument();
  });

  it("renders the layout and nested route content for a member user", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 5, name: "Abebe Balcha", role: "member" },
      logout: vi.fn(),
    } as ReturnType<typeof useAuthStore>);

    renderAtMember();
    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
    expect(screen.getAllByText("Abebe Balcha").length).toBeGreaterThan(0);
  });

  it("calls logout and does not throw when the logout control is used", async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 5, name: "Abebe Balcha", role: "member" },
      logout,
    } as ReturnType<typeof useAuthStore>);

    renderAtMember();
    const logoutButtons = screen.getAllByRole("button", {
      name: /member\.logout/i,
    });
    fireEvent.click(logoutButtons[0]);
    expect(logout).toHaveBeenCalled();
  });
});
