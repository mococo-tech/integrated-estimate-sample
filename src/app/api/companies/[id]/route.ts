import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        documents: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "顧客が見つかりません" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: company });
  } catch (error) {
    console.error("Get company error:", error);
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

    const company = await prisma.company.update({
      where: { id },
      data: {
        name: body.name,
        zipCode: body.zipCode || null,
        address: body.address || null,
        phone: body.phone || null,
        fax: body.fax || null,
        email: body.email || null,
        contactName: body.contactName || null,
        note: body.note || null,
      },
    });

    return NextResponse.json({ success: true, data: company });
  } catch (error) {
    console.error("Update company error:", error);
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

    // 関連する見積もりがあるか確認
    const documentsCount = await prisma.document.count({
      where: { companyId: id },
    });

    if (documentsCount > 0) {
      return NextResponse.json(
        { success: false, error: { code: "HAS_RELATIONS", message: "この顧客には見積もりが存在するため削除できません" } },
        { status: 400 }
      );
    }

    await prisma.company.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete company error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } },
      { status: 500 }
    );
  }
}
