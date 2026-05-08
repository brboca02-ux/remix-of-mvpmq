import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/agenda/setup")({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/agenda/ops",
      search: {
        ...search,
        tab: "setup",
      },
    });
  },
});
