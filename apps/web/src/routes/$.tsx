import { data, type MetaFunction } from "react-router";

import { NotFoundPage } from "@/components/not-found-page";

export const meta: MetaFunction = () => [{ title: "Page not found" }];

export default function SplatNotFoundRoute() {
  return <NotFoundPage />;
}
