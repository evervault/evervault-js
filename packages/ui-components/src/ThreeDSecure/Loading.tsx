import { BRANDS, BrandLogo } from "./BrandLogo";

export function ThreeDSecureLoading({ session }: { session: string }) {
  const brand = session.split("_")[1] as keyof typeof BRANDS;

  return (
    <div
      style={{
        gap: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        placeItems: "center",
        height: "100%",
      }}
    >
      <svg
        ev-spinner=""
        className="spinner"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2"
        ></path>
      </svg>
      <BrandLogo brand={brand} />
    </div>
  );
}
