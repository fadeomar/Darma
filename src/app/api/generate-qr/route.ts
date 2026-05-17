import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";

const MAX_QR_TEXT_LENGTH = 2000;

const qrCodeRequestSchema = z.object({
  text: z.string().trim().min(1).max(MAX_QR_TEXT_LENGTH),
});

type QRCodeResponse = {
  qrCodeUrl?: string;
  error?: string;
};

export async function POST(req: NextRequest): Promise<NextResponse<QRCodeResponse>> {
  try {
    const json = await req.json().catch(() => null);
    const parsed = qrCodeRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: `Invalid input. Text is required and must be ${MAX_QR_TEXT_LENGTH} characters or fewer.` },
        { status: 400 },
      );
    }

    const qrCodeUrl = await QRCode.toDataURL(parsed.data.text, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 1024,
    });

    return NextResponse.json({ qrCodeUrl }, { status: 200 });
  } catch (error: unknown) {
    console.error("QR code generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 },
    );
  }
}
