import { auth } from "../config/firebase";

function parseArg(flag: string): string | undefined {
  const found = process.argv.find((a) => a === flag || a.startsWith(flag + "="));
  if (!found) return undefined;
  const eq = found.indexOf("=");
  return eq >= 0 ? found.slice(eq + 1) : undefined;
}

async function main() {
  const email = parseArg("--email") || process.env.EMAIL;
  const role = (parseArg("--role") || process.env.ROLE || "ADMIN").toUpperCase();
  if (!email) {
    console.error("Usage: node dist/scripts/setAdminRole.js --email=<email> [--role=ADMIN|USER]");
    process.exit(1);
  }
  if (role !== "ADMIN" && role !== "USER") {
    console.error("Invalid role. Use ADMIN or USER");
    process.exit(1);
  }
  try {
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, { role });
    console.log(`Set custom claim role=${role} for ${email} (uid=${user.uid})`);
    console.log("Note: User must sign out and sign in again for the new claim to take effect.");
  } catch (e: any) {
    console.error("Failed to set role:", e?.message || e);
    process.exit(1);
  }
}

main();
