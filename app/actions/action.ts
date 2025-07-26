"use server";

import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

export async function doLogin(email: string, password: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    const cookieStore = await cookies(); // ✅ TANPA await
    cookieStore.set("authToken", data.token, {
      httpOnly: true,
      secure: false,
      path: "/",
      maxAge: 3600,
    });

    console.log("Login successful:", data);
    return data;
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Login failed" };
  }
}

export async function getToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken");

  if (!token) {
    throw new Error("No authentication token found");
  }

  return token.value;
}

export async function doLogout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("authToken");
    console.log("Logout successful");
  } catch (error) {
    console.error("Logout error:", error);
  }
}
