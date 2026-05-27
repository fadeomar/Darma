import { WarningPanel } from "@/features/tools/components";
import type { CspValidationMessage } from "../types";
export function CspRiskPanel({ messages }: { messages: CspValidationMessage[] }) { return <WarningPanel title="Risk warnings" messages={messages.map((message, index) => ({ id: `${message.severity}-${index}`, severity: message.type === "error" || message.severity === "high" ? "danger" : message.type === "warning" ? "warning" : "info", title: message.directiveName, message: message.message }))} />; }
