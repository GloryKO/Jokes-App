import bcrypt from "bcryptjs";
import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { db } from "./db.server";

interface LoginForm {
  username: string;
  password: string;
}

export async function login({ username, password }: LoginForm) {
  const user = await db.user.findUnique({
    where: { username },
  });
  if (!user) return null;

  const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isCorrectPassword) return null;

  return { id: user.id, username };
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("Session secret must be set");
}

const storage = createCookieSessionStorage({
  cookie: {
    name: "RemixJokesSessions",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export async function createUserSession(userID: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userID", userID);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserID(request: Request) {
  const session = await getUserSession(request);
  const userID = session.get("userID");
  if (!userID || typeof userID !== "string") return null;

  return userID;
}

export async function requireUserID(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request);
  const userID = session.get("userID");
  if (!userID || typeof userID !== "string") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userID;
}

export async function getUser(request: Request) {
  const userID = await getUserID(request);
  if (typeof userID !== "string") {
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userID },
      select: { id: true, username: true },
    });
    return user;
  } catch {
    throw logout(request);
  }
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}
