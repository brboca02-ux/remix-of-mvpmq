import { render } from "@testing-library/react";
import { SiteFooter } from "../components/site-footer";
import { SafeIcon } from "../lib/icons";
import { describe, it, expect } from "vitest";
import React from "react";

describe("SiteFooter Snapshot", () => {
  it("renders correctly and matches snapshot", () => {
    const { asFragment } = render(<SiteFooter />);
    expect(asFragment()).toMatchSnapshot();
  });
});

describe("SafeIcon System", () => {
  it("renders an existing icon", () => {
    const { container } = render(<SafeIcon name="Check" />);
    // Lucide icons are SVGs
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it("renders fallback for missing icon", () => {
    const { container } = render(<SafeIcon name="NonExistentIcon" />);
    // Default fallback is HelpCircle (or whatever was set in lib/icons.tsx)
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
