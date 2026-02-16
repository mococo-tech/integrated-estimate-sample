import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const office = await prisma.office.findUnique({
      where: { id },
    });

    if (!office) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "自社情報が見つかりません" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: office });
  } catch (error) {
    console.error("Get office error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "会社名は必須です" } },
        { status: 400 }
      );
    }

    const office = await prisma.office.update({
      where: { id },
      data: {
        name: body.name,
        zipCode: body.zipCode || null,
        address: body.address || null,
        phone: body.phone || null,
        fax: body.fax || null,
        email: body.email || null,
        bankInfo: body.bankInfo || null,
        invoiceNo: body.invoiceNo || null,
      },
    });

    return NextResponse.json({ success: true, data: office });
  } catch (error) {
    console.error("Update office error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } },
      { status: 500 }
    );
  }
}
