import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "メールアドレスとパスワードを入力してください" } },
        { status: 400 }
      );
    }

    const person = await prisma.person.findUnique({
      where: { email },
      include: { office: true },
    });

    if (!person) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "メールアドレスまたはパスワードが正しくありません" } },
        { status: 401 }
      );
    }

    if (!person.isActive) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "このアカウントは無効化されています" } },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, person.password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "メールアドレスまたはパスワードが正しくありません" } },
        { status: 401 }
      );
    }

    const token = await signToken({
      id: person.id,
      email: person.email,
      role: person.role,
    });

    await setAuthCookie(token);

    const { password: _, ...personWithoutPassword } = person;

    return NextResponse.json({
      success: true,
      data: { user: personWithoutPassword },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } },
      { status: 500 }
    );
  }
}
