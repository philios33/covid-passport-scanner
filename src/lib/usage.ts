import axios from "axios";
import { GreenCertificateResult } from "./decode";

async function sendUsage(type: string, data: any) {
    try {
        if (process.env.DEVMODE) {
            // Don't send anything to the webpack dev server
            return;
        }
        await axios({
            url: "/usage/" + type,
            method: "POST",
            data: JSON.stringify(data),
            headers: {
                "content-type": "application/json",
            }
        });
    } catch(e) {
        console.warn(e);
    }
}

export function reportSuccess(rawText: string, result: GreenCertificateResult) {
    if (result.isValidNow && result.signatureVerified) {
        sendUsage("success", {
            input: rawText,
            output: result,
        });
    } else {
        sendUsage("invalid", {
            input: rawText,
            output: result,
        });
    }
}

export function reportError(rawText: string, e: Error) {
    sendUsage("error", {
        input: rawText,
        name: e.name,
        message: e.message,
    });
}
