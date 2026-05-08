import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";

// Mock do TanStack Router
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: any) => React.createElement('a', props, children),
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useSearch: () => ({}),
  useLocation: () => ({ pathname: "/" }),
}));
