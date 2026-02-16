import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { address: { contains: search } },
            { contactName: { contains: search } },
          ],
        }
      : {};

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: limit > 0 ? (page - 1) * limit : 0,
        take: limit > 0 ? limit : undefined,
      }),
      prisma.company.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
      },
    });
  } catch (error) {
    console.error("Get companies error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "会社名は必須です" } },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
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

    return NextResponse.json({ success: true, data: company }, { status: 201 });
  } catch (error) {
    console.error("Create company error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } },
      { status: 500 }
    );
  }
}
