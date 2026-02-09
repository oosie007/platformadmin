/** Shared env selector constants (safe for client and server). */

export type EnvKey = "sit" | "uat";

export const ENV_COOKIE_NAME = "migration-console-env";

export const ENV_KEYS: EnvKey[] = ["sit", "uat"];

export function isValidEnvKey(value: string | null | undefined): value is EnvKey {
  return value === "sit" || value === "uat";
}

export const ENV_LABELS: Record<EnvKey, string> = {
  sit: "EMEA – SIT",
  uat: "EMEA – UAT",
};
