"use server";

import { User } from "@prisma/client";
import prisma from "../prisma";
import * as bcrypt from "bcrypt";
import {
  compileActivationTemplate,
  compileResetPassTemplate,
  sendMail,
} from "../mail";
import { signJWT, verifyJWT } from "../jwt";

export async function registerUser(
  user: Omit<User, "id" | "emailVerified" | "image">
) {
  const result = await prisma.user.create({
    data: { ...user, password: await bcrypt.hash(user.password, 10) },
  });

  const jwtUserId = signJWT({
    id: result.id,
  });

  const activationUrl = `${process.env.NEXTAUTH_URL}/auth/activation/${jwtUserId}`;
  const body = compileActivationTemplate(user.firstName, activationUrl);
  await sendMail({ to: user.email, subject: "Activate Your Account", body });
  return result;
}

type ActivateUserFunc = (
  jwtUserId: string
) => Promise<"userNotExist" | "alreadyActivated" | "success">;

export const activateUser: ActivateUserFunc = async (jwtUserId) => {
  const payload = verifyJWT(jwtUserId);
  const userId = payload?.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return "userNotExist";
  if (user.emailVerified) return "alreadyActivated";
  const result = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      emailVerified: new Date(),
    },
  });

  return "success";
};

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) throw new Error("The User Does Not Exists!");

  const jwtUserId = signJWT({
    id: user.id,
  });

  const resetPasswordUrl = `${process.env.NEXTAUTH_URL}/auth/resetPassword/${jwtUserId}`;
  const body = compileResetPassTemplate(user.firstName, resetPasswordUrl);
  const sendResult = await sendMail({
    to: user.email,
    body: body,
    subject: "Reset Password",
  });

  return sendResult;
}

type ResetPasswordFunc = (
  jwtUserId: string,
  password: string
) => Promise<"userNotExists" | "success">;

export const resetPassword: ResetPasswordFunc = async (jwtUserId, password) => {
  const payload = verifyJWT(jwtUserId);
  if (!payload) return "userNotExists";
  const userId = payload.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return "userNotExists";

  const result = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: await bcrypt.hash(password, 10),
    },
  });

  if (result) return "success";
  else throw Error("Something went wrong!");
};
