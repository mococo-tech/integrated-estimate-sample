import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const year = new Date().getFullYear();
    const prefix = `Q-${year}-`;

    const lastDoc = await prisma.document.findFirst({
      where: { documentNo: { startsWith: prefix } },
      orderBy: { documentNo: "desc" },
      select: { documentNo: true },
    });

    let nextNumber = 1;
    if (lastDoc) {
      const lastNumber = parseInt(lastDoc.documentNo.slice(-3));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const documentNo = `${prefix}${String(nextNumber).padStart(3, "0")}`;

    return NextResponse.json({ success: true, data: { documentNo } });
  } catch (error) {
    console.error("Generate document number error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } },
      { status: 500 }
    );
  }
}
