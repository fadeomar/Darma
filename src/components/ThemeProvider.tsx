import { cookies } from "next/headers";

export default async function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const theme = (await cookieStore).get("theme")?.value || "light";

  return (
    <html lang="en" data-mode={theme}>
      <body>{children}</body>
    </html>
  );
}
