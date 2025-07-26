"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const router = useRouter();

  const handleRedirect = () => {
    const adminAuth = localStorage.getItem("adminAuth");
    const authToken = localStorage.getItem("authToken");

    if (adminAuth) {
      router.push("/admin");
    } else if (!authToken && !adminAuth) {
      router.push("/produk");
    }
  };

  useEffect(() => {
    document.body.style.fontFamily = '"Poppins", sans-serif';
  }, []);

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
          Selamat Datang di Toko Alat Sekolah
        </h1>
        <p className="text-gray-600 mb-10">
          Temukan berbagai perlengkapan sekolah berkualitas, mulai dari alat
          tulis, seragam, hingga kebutuhan pendukung lainnya.
        </p>
        <button
          onClick={handleRedirect}
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-6 py-3 rounded-xl transition"
        >
          Mulai Belanja
        </button>
      </div>
    </main>
  );
}
