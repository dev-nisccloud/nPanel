import { Link } from "react-router";

export const Logo = () => {
  return (
    <Link to="/">
      <div className="size-8 relative shrink-0">
        <img
          src="/logo.svg"
          alt="The Canvas"
          className="absolute inset-0 h-full w-full shrink-0 object-contain hover:opacity-75 transition"
        />
      </div>
    </Link>
  );
};
