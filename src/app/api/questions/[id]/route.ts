import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

interface Params {
  params: {
    id: string;
  };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { question, answer, unitId, marks, years, exams } = body;

    const dataToUpdate: any = {};
    if (question !== undefined) dataToUpdate.question = typeof question === "string" ? question.trim() : "";
    if (answer !== undefined) dataToUpdate.answer = typeof answer === "string" ? answer.trim() : "";
    if (unitId !== undefined) dataToUpdate.unitId = unitId;
    if (marks !== undefined) dataToUpdate.marks = marks ? Number(marks) : null;
    if (years !== undefined) {
      dataToUpdate.years = Array.isArray(years) ? JSON.stringify(years) : years;
      if (Array.isArray(years)) {
        dataToUpdate.repeatCount = Math.max(1, years.length);
      }
    }
    if (exams !== undefined) {
      dataToUpdate.exams = Array.isArray(exams) ? JSON.stringify(exams) : exams;
    }

    const updated = await prisma.question.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.question.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
