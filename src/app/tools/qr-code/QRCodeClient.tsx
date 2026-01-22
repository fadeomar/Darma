"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";

interface QRCodeResponse {
  qrCodeUrl: string;
}

export default function QRCodeClient() {
  const [inputText, setInputText] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setQrCodeUrl("");

    if (!inputText.trim()) {
      setError("Please enter text or a URL.");
      return;
    }

    try {
      const response = await fetch("/api/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate QR code.");
      }

      const data: QRCodeResponse = await response.json();
      setQrCodeUrl(data.qrCodeUrl);
    } catch {
      setError("An error occurred while generating the QR code.");
    }
  };

  const handleDownload = () => {
    if (qrCodeUrl) {
      const link = document.createElement("a");
      link.href = qrCodeUrl;
      link.download = "qrcode.png";
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="text-center mb-12 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
          Free QR Code Generator
        </h1>
        <p className="text-lg sm:text-xl text-gray-600">
          Create scannable QR codes instantly for URLs, text, Wi-Fi, or contact
          details. Simple, fast, and 100% free!
        </p>
      </section>

      {/* QR Code Generator Form */}
      <section className="w-full max-w-md bg-white p-6 sm:p-8 rounded-xl shadow-lg mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Generate Your QR Code
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="inputText"
              className="block text-sm font-medium text-gray-700"
            >
              Enter Text or URL
            </label>
            <input
              type="text"
              id="inputText"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="mt-2 block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="e.g., https://example.com"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            Generate QR Code
          </button>
        </form>
        {qrCodeUrl && (
          <div className="mt-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your QR Code
            </h3>
            <div className="flex justify-center">
              <Image
                src={qrCodeUrl}
                alt="Generated QR Code"
                width={200}
                height={200}
                className="rounded-md shadow-sm"
              />
            </div>
            <button
              onClick={handleDownload}
              className="mt-6 inline-block bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            >
              Download QR Code
            </button>
          </div>
        )}
      </section>

      {/* About Section */}
      <section className="w-full max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
          About Our QR Code Generator 🛠️
        </h2>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
          <article className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="flex items-start">
              <span className="text-3xl mr-3">📱</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  What is a QR Code?
                </h3>
                <p className="mt-2 text-gray-600">
                  A QR code (Quick Response code) is a scannable barcode that
                  stores information like website URLs, contact details, or
                  plain text. Scan it with a smartphone camera to access the
                  content instantly!
                </p>
              </div>
            </div>
          </article>

          <article className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="flex items-start">
              <span className="text-3xl mr-3">✨</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  What Does This Tool Do?
                </h3>
                <p className="mt-2 text-gray-600">
                  Our free QR code generator creates high-quality QR codes in
                  seconds. Enter any URL, text, Wi-Fi credentials, or contact
                  info, and download a scannable QR code to share
                  anywhere—online or offline.
                </p>
              </div>
            </div>
          </article>

          <article className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="flex items-start">
              <span className="text-3xl mr-3">🤔</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  When to Use It?
                </h3>
                <ul className="mt-2 list-disc list-inside text-gray-600 space-y-1">
                  <li>
                    Share website links on flyers, posters, or business cards.
                  </li>
                  <li>Create digital contact cards for seamless networking.</li>
                  <li>Encode Wi-Fi details for quick guest access.</li>
                  <li>
                    Add scannable codes to menus, tickets, or product packaging.
                  </li>
                  <li>Promote events with links to registration or details.</li>
                </ul>
              </div>
            </div>
          </article>

          <article className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="flex items-start">
              <span className="text-3xl mr-3">💡</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Why Choose Our Tool?
                </h3>
                <ul className="mt-2 list-disc list-inside text-gray-600 space-y-1">
                  <li>
                    <strong>Completely Free</strong>: No subscriptions or hidden
                    fees.
                  </li>
                  <li>
                    <strong>User-Friendly</strong>: Intuitive design for
                    beginners and pros.
                  </li>
                  <li>
                    <strong>Instant Results</strong>: Generate and download QR
                    codes in seconds.
                  </li>
                  <li>
                    <strong>Versatile</strong>: Supports URLs, text, Wi-Fi, and
                    more.
                  </li>
                  <li>
                    <strong>Reliable</strong>: High-quality, scannable QR codes
                    every time.
                  </li>
                </ul>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
