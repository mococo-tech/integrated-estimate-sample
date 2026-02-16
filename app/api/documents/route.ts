import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (search) {
      where.OR = [
        { documentNo: { contains: search } },
        { title: { contains: search } },
        { company: { name: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          person: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: limit > 0 ? (page - 1) * limit : 0,
        take: limit > 0 ? limit : undefined,
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
      },
    });
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.title || !body.companyId || !body.documentNo) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "必須項目を入力してください" } },
        { status: 400 }
      );
    }

    // 見積もり番号の重複チェック
    const existing = await prisma.document.findUnique({
      where: { documentNo: body.documentNo },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE", message: "この見積もり番号は既に使用されています" } },
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

    const document = await prisma.document.create({
      data: {
        documentNo: body.documentNo,
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
        personId: session.id,
        officeId: session.officeId,
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
        items: true,
        company: true,
        person: true,
      },
    });

    return NextResponse.json({ success: true, data: document }, { status: 201 });
  } catch (error) {
    console.error("Create document error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } },
      { status: 500 }
    );
  }
}
