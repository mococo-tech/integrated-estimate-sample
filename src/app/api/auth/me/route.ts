import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth";

export async function GET() {
  try {
    const person = await getSession();

    if (!person) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 }
      );
    }

    const { password: _, ...personWithoutPassword } = person;

    return NextResponse.json({
      success: true,
      data: { user: personWithoutPassword },
    });
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } },
      { status: 500 }
    );
  }
}
