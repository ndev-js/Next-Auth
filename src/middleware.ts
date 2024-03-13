export { default } from "next-auth/middleware";
//here is the middleware implementation
export const config = {
  matcher: ["/profile", "/admin/:path*"],
};
