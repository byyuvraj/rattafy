import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            units: true,
            questions: true,
          },
        },
      },
    });

    const formatted = subjects.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code || "",
      branch: s.branch || "",
      year: s.year || "",
      syllabus: s.syllabus || "",
      createdAt: s.createdAt.getTime(),
      unitsCount: s._count.units,
      questionsCount: s._count.questions,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, code = "", branch = "", year = "", initialUnits = 5, syllabus = "" } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Subject name is required" }, { status: 400 });
    }

    const subject = await prisma.$transaction(async (tx) => {
      const created = await tx.subject.create({
        data: {
          name: name.trim(),
          code: code?.trim() || null,
          branch: branch?.trim() || null,
          year: year?.trim() || null,
          syllabus: syllabus.trim() || null,
        },
      });

      const unitsToCreate = [];
      const count = Math.max(1, Math.min(20, Number(initialUnits) || 5));
      for (let i = 1; i <= count; i++) {
        unitsToCreate.push({
          subjectId: created.id,
          number: i,
          title: `Unit ${i}`,
        });
      }

      await tx.unit.createMany({
        data: unitsToCreate,
      });

      return created;
    });

    return NextResponse.json({
      id: subject.id,
      name: subject.name,
      code: subject.code || "",
      branch: subject.branch || "",
      year: subject.year || "",
      syllabus: subject.syllabus || "",
      createdAt: subject.createdAt.getTime(),
      unitsCount: initialUnits,
      questionsCount: 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
