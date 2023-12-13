const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { select } = require("@inquirer/prompts");

const dirs = fs
  .readdirSync(__dirname, { withFileTypes: true })
  .filter((f) => f.isDirectory());

select({
  message: "Which example do you want to run?",
  choices: dirs.map((d) => {
    const pkgJson = path.join(__dirname, d.name, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgJson, "utf-8"));
    return {
      name: d.name,
      value: pkg.name,
    };
  }),
}).then((example) => {
  spawn(
    "dotenv",
    [
      "--",
      "turbo",
      "dev",
      "--filter",
      "@evervault/ui-components",
      "--filter",
      `${example}...`,
    ],
    {
      stdio: "inherit",
    }
  );
});
