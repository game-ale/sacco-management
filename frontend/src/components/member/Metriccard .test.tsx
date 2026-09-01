import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Landmark } from "lucide-react";
import { MetricCard } from "./Metriccard ";

describe("MetricCard", () => {
  it("renders the title and value", () => {
    render(
      <MetricCard
        title="Total Savings"
        value="ETB 145,000.00"
        icon={Landmark}
        accentColor="green"
      />,
    );

    expect(screen.getByText("Total Savings")).toBeInTheDocument();
    expect(screen.getByText("ETB 145,000.00")).toBeInTheDocument();
  });

  it("renders a numeric value", () => {
    render(
      <MetricCard
        title="Active Loans"
        value={3}
        icon={Landmark}
        accentColor="rose"
      />,
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders the subtitle when provided", () => {
    render(
      <MetricCard
        title="Total Savings"
        value="ETB 145,000.00"
        icon={Landmark}
        accentColor="green"
        subtitle={<span>↑ 12%</span>}
      />,
    );
    expect(screen.getByText("↑ 12%")).toBeInTheDocument();
  });

  it("does not render a subtitle element when none is provided", () => {
    const { container } = render(
      <MetricCard
        title="Share Capital"
        value="ETB 20,000.00"
        icon={Landmark}
        accentColor="black"
      />,
    );
    // No extra subtitle line beyond title + value
    expect(container.querySelectorAll("span").length).toBe(2);
  });

  it("applies highlight styling when bgHighlight is true", () => {
    const { container } = render(
      <MetricCard
        title="Next Installment"
        value="ETB 4,500.00"
        icon={Landmark}
        accentColor="amber"
        bgHighlight
      />,
    );
    expect(container.firstChild).toHaveClass("bg-[#FFFDF0]");
  });

  it("uses custom icon colors when iconBgColor/iconTextColor are provided", () => {
    const { container } = render(
      <MetricCard
        title="Custom"
        value="1"
        icon={Landmark}
        accentColor="green"
        iconBgColor="bg-red-500"
        iconTextColor="text-white"
      />,
    );
    const iconWrapper = container.querySelector(".bg-red-500");
    expect(iconWrapper).toBeInTheDocument();
    expect(iconWrapper).toHaveClass("text-white");
  });
});
