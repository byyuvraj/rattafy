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
    const subject = await prisma.subject.findUnique({
      where: { id: params.id },
      include: {
        units: {
          orderBy: { number: "asc" },
        },
        questions: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const formattedUnits = subject.units.map((u) => ({
      id: u.id,
      subjectId: u.subjectId,
      number: u.number,
      title: u.title,
    }));

    const formattedQuestions = subject.questions.map((q) => {
      let years: string[] = [];
      let exams: string[] = [];
      try {
        years = JSON.parse(q.years);
      } catch {
        years = [];
      }
      try {
        exams = JSON.parse(q.exams);
      } catch {
        exams = [];
      }

      return {
        id: q.id,
        subjectId: q.subjectId,
        unitId: q.unitId,
        question: q.question,
        answer: q.answer,
        marks: q.marks || undefined,
        years,
        exams,
        repeatCount: q.repeatCount,
        status: "new" as const,
        starred: false,
        notes: "",
        createdAt: q.createdAt.getTime(),
        updatedAt: q.updatedAt.getTime(),
      };
    });

    return NextResponse.json({
      subject: {
        id: subject.id,
        name: subject.name,
        syllabus: subject.syllabus || "",
        createdAt: subject.createdAt.getTime(),
      },
      units: formattedUnits,
      questions: formattedQuestions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, syllabus } = body;

    const updated = await prisma.subject.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(syllabus !== undefined ? { syllabus: syllabus.trim() || null } : {}),
      },
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
    await prisma.subject.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
