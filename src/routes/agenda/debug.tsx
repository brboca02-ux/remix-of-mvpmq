import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/agenda/debug")({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/agenda/ops",
      search: {
        ...search,
        tab: "debug",
      },
    });
  },
});
