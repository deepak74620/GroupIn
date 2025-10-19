// src/app/layout.tsx

    import "~/styles/globals.css";

    import { Inter } from "next/font/google";
    import { headers } from "next/headers";

    import { SessionProvider } from "next-auth/react";

    // CORRECTED IMPORT PATH for your project structure
    import { auth } from "~/server/auth";

    import { TRPCReactProvider } from "~/trpc/react";

    const inter = Inter({
      subsets: ["latin"],
      variable: "--font-sans",
    });

    export const metadata = {
      title: "Group Collab",
      description: "A personalized group collaboration platform",
      icons: [{ rel: "icon", url: "/favicon.ico" }],
    };

    export default async function RootLayout({
      children,
    }: {
      children: React.ReactNode;
    }) {
      const session = await auth();

      return (
        <html lang="en">
          <body className={`font-sans ${inter.variable}`}>
            <SessionProvider session={session}>
              <TRPCReactProvider headers={headers()}>
                {children}
              </TRPCReactProvider>
            </SessionProvider>
          </body>
        </html>
      );
    }