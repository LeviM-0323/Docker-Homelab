import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryDirectory = resolve(appDirectory, "../..");
const composeArguments = [
  "compose",
  "--project-directory",
  repositoryDirectory,
  "--file",
  resolve(repositoryDirectory, "docker-compose.yml"),
  "--profile",
  "portfolio-test",
];
const testServices = [
  "portfolio-e2e",
  "portfolio-test-db",
  "portfolio-mailpit",
];

function runCompose(arguments_) {
  const result = spawnSync("docker", [...composeArguments, ...arguments_], {
    cwd: repositoryDirectory,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`docker compose ${arguments_.join(" ")} failed`);
  }
}

async function waitForHealth() {
  const deadline = Date.now() + 120_000;
  let lastFailure = "the app has not responded yet";

  while (Date.now() < deadline) {
    const result = spawnSync(
      "docker",
      [
        ...composeArguments,
        "exec",
        "-T",
        "portfolio-e2e",
        "node",
        "-e",
        "fetch('http://127.0.0.1:3000/api/health').then(async (response) => { const body = await response.json(); if (!response.ok || body.status !== 'ok') process.exit(1); }).catch(() => process.exit(1))",
      ],
      {
        cwd: repositoryDirectory,
        encoding: "utf8",
      },
    );

    if (result.error) {
      lastFailure = result.error.message;
    } else if (result.status === 0) {
      return;
    } else {
      lastFailure = result.stderr.trim() || "health endpoint is not ready";
    }

    await delay(1_000);
  }

  throw new Error(
    `Staging app did not become healthy within 120 seconds: ${lastFailure}`,
  );
}

let failure;

try {
  runCompose(["up", "--build", "--detach", "--force-recreate", "portfolio-e2e"]);
  await waitForHealth();

  runCompose([
    "exec",
    "-T",
    "portfolio-e2e",
    "node",
    "--test",
    "/app/tests/staging-http.test.mjs",
  ]);
} catch (error) {
  failure = error;
} finally {
  try {
    runCompose(["rm", "--stop", "--force", "--volumes", ...testServices]);
  } catch (error) {
    if (!failure) {
      failure = error;
    } else {
      console.error("Could not remove the isolated test containers:", error);
    }
  }
}

if (failure) {
  throw failure;
}
