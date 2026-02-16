import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        company: true,
        person: true,
        office: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "見積もりが見つかりません" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: document });
  } catch (error) {
    console.error("Get document error:", error);
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

    if (!body.title || !body.companyId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "必須項目を入力してください" } },
        { status: 400 }
      );
    }

    // 明細行から金額を計算
    const items = body.items || [];
    const subtotal = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    );
    const taxRate = body.taxRate || 10;
    const taxAmount = Math.floor(subtotal * taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    // 既存の明細行を削除
    await prisma.quoteItem.deleteMany({ where: { documentId: id } });

    const document = await prisma.document.update({
      where: { id },
      data: {
        title: body.title,
        issueDate: new Date(body.issueDate || new Date()),
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        status: body.status || "draft",
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        note: body.note || null,
        paymentTerms: body.paymentTerms || null,
        deliveryDate: body.deliveryDate || null,
        deliveryPlace: body.deliveryPlace || null,
        companyId: body.companyId,
        items: {
          create: items.map(
            (
              item: {
                itemName: string;
                description?: string;
                quantity: number;
                unit?: string;
                unitPrice: number;
              },
              index: number
            ) => ({
              sortOrder: index + 1,
              itemName: item.itemName,
              description: item.description || null,
              quantity: item.quantity,
              unit: item.unit || null,
              unitPrice: item.unitPrice,
              amount: item.quantity * item.unitPrice,
            })
          ),
        },
      },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        company: true,
        person: true,
      },
    });

    return NextResponse.json({ success: true, data: document });
  } catch (error) {
    console.error("Update document error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } },
      { status: 500 }
    );
  }
}
