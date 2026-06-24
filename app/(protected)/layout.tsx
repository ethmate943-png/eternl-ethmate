import { headers } from "next/headers";
import Navbar from "../../components/Navbar";
import ReffererProvider from "./ReffererProvider";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProtectedLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const isBot =
        /googlebot|bingbot|msnbot|bingpreview|adidxbot|slurp|duckduckbot|baiduspider|yandexbot/i.test(
            userAgent
        );

    return (
        <ReffererProvider isBot={isBot}>
            <Navbar />
            {children}
        </ReffererProvider>
    );
}
