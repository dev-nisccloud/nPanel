import { Navigate, useParams } from "react-router";

export default function TeamIndexRedirect() {
  const { slug } = useParams();
  if (!slug) return <Navigate to="/create-team" replace />;
  return <Navigate to={`/${slug}/dashboard`} replace />;
}
