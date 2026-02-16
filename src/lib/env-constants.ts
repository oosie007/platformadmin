/** Shared env selector constants (safe for client and server). */

export type EnvKey = "sit" | "uat" | "sit-latam" | "uat-latam";

export const ENV_COOKIE_NAME = "migration-console-env";

export const ENV_KEYS: EnvKey[] = ["sit", "uat", "sit-latam", "uat-latam"];

export function isValidEnvKey(value: string | null | undefined): value is EnvKey {
  return (
    value === "sit" ||
    value === "uat" ||
    value === "sit-latam" ||
    value === "uat-latam"
  );
}

export const ENV_LABELS: Record<EnvKey, string> = {
  sit: "EMEA – SIT",
  uat: "EMEA – UAT",
  "sit-latam": "LATAM – SIT",
  "uat-latam": "LATAM – UAT",
};
