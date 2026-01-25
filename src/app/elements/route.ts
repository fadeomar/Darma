// src/app/api/elements/route.ts
import { NextResponse } from "next/server";
import { makeElementWriteService } from "@/features/projects/di/adminWrite";
import { elementCreateSchema } from "@/features/projects/validation/elementWriteSchemas";
import { parseJsonBody } from "@/shared/http/validation";

// Use your existing mapper
import { toElementDTO } from "@/features/projects/dto/element.dto.mapper";

export async function POST(req: Request) {
  // TODO: enforce admin auth boundary here (middleware or here)
  const json = await req.json().catch(() => null);
  const parsed = parseJsonBody(elementCreateSchema, json);

  if (!parsed.ok) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  try {
    const service = makeElementWriteService();
    const created = await service.create(parsed.data);

    return NextResponse.json(toElementDTO(created), { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  } catch (err: any) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
