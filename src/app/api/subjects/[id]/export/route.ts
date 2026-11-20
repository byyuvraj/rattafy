import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSubjectMarkdown, getExportFilename } from "@/lib/exportMarkdown";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: params.id },
      include: {
        units: { orderBy: { number: "asc" } },
        questions: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const markdown = generateSubjectMarkdown(
      subject,
      subject.units,
      subject.questions
    );

    const filename = getExportFilename(subject);

    const url = new URL(req.url);
    const isDownload = url.searchParams.get("download") === "true";

    if (isDownload) {
      return new NextResponse(markdown, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      markdown,
      filename,
      questionsCount: subject.questions.length,
      unitsCount: subject.units.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
