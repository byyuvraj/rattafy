import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const units = await prisma.unit.findMany({
      where: { subjectId: params.id },
      orderBy: { number: "asc" },
    });
    return NextResponse.json(units);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { number, title } = body;

    const unit = await prisma.unit.create({
      data: {
        subjectId: params.id,
        number: Number(number),
        title: title?.trim() || `Unit ${number}`,
      },
    });

    return NextResponse.json(unit);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
