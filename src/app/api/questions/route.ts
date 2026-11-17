import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subjectId, unitId, unitNumber, question, answer, marks, years, exams } = body;

    if (!subjectId || !question?.trim()) {
      return NextResponse.json(
        { error: "Subject ID and question text are required" },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { units: true },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Resolve unit
    let resolvedUnitId = unitId;
    if (!resolvedUnitId) {
      const targetNum = unitNumber !== undefined && !isNaN(Number(unitNumber)) ? Number(unitNumber) : 1;
      let unit = subject.units.find((u) => u.number === targetNum);

      if (!unit) {
        unit = await prisma.unit.create({
          data: {
            subjectId,
            number: targetNum,
            title: targetNum === 0 ? "General Questions" : `Unit ${targetNum}`,
          },
        });
      }
      resolvedUnitId = unit.id;
    }

    const parsedYears = Array.isArray(years)
      ? years
      : typeof years === "string"
      ? years.split(",").map((y) => y.trim()).filter(Boolean)
      : [];

    const parsedExams = Array.isArray(exams)
      ? exams
      : typeof exams === "string"
      ? exams.split(",").map((e) => e.trim()).filter(Boolean)
      : [];

    const newQuestion = await prisma.question.create({
      data: {
        subjectId,
        unitId: resolvedUnitId,
        question: question.trim(),
        answer: (answer || "").trim(),
        marks: marks ? Number(marks) : null,
        years: JSON.stringify(parsedYears),
        exams: JSON.stringify(parsedExams),
        repeatCount: Math.max(1, parsedYears.length),
      },
    });

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
