import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";
import { ParsedUnitGroup } from "@/types";

export async function POST(req: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subjectId, groups } = body as { subjectId: string; groups: ParsedUnitGroup[] };

    if (!subjectId || !groups || !Array.isArray(groups)) {
      return NextResponse.json({ error: "Missing subjectId or groups" }, { status: 400 });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { units: true },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const unitMapByNumber = new Map<number, string>();
    subject.units.forEach((u) => {
      unitMapByNumber.set(u.number, u.id);
    });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Ensure all units exist
      for (const group of groups) {
        if (!unitMapByNumber.has(group.unitNumber)) {
          const newUnit = await tx.unit.create({
            data: {
              subjectId,
              number: group.unitNumber,
              title: group.unitTitle || (group.unitNumber === 0 ? "Unsorted Questions" : `Unit ${group.unitNumber}`),
            },
          });
          unitMapByNumber.set(group.unitNumber, newUnit.id);
        }
      }

      // 2. Insert questions
      const questionsData = [];
      for (const group of groups) {
        const unitId = unitMapByNumber.get(group.unitNumber)!;
        for (const q of group.questions) {
          questionsData.push({
            subjectId,
            unitId,
            question: q.question.trim(),
            answer: q.answer?.trim() || "",
            marks: q.marks || null,
            years: JSON.stringify(q.years || []),
            exams: JSON.stringify(q.exams || []),
            repeatCount: q.repeatCount || 1,
          });
        }
      }

      if (questionsData.length > 0) {
        await tx.question.createMany({
          data: questionsData,
        });
      }

      return { totalImported: questionsData.length };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
