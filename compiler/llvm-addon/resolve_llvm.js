"use strict";

const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const HEADER_PARTS = ["include", "llvm-c", "Core.h"];
const checked = [];

function normalize(value) {
  return path.resolve(value).replaceAll("\\", "/");
}

function record(candidate, reason) {
  checked.push(`${normalize(candidate)} (${reason})`);
}

function libraryIn(root) {
  const libDirs = [path.join(root, "lib"), path.join(root, "lib64")];

  if (process.platform === "win32") {
    for (const libDir of libDirs) {
      const library = path.join(libDir, "LLVM-C.lib");
      if (existsFile(library)) {
        return { libDir, library };
      }
    }
    return null;
  }

  const preferredNames =
    process.platform === "darwin"
      ? [/^libLLVM(?:-[^.]+)?\.dylib$/, /^libLLVM-C(?:-[^.]+)?\.dylib$/]
      : [
          /^libLLVM(?:-[^.]+)?\.so(?:\..*)?$/,
          /^libLLVM-C(?:-[^.]+)?\.so(?:\..*)?$/,
        ];
  const fallbackNames = [/^libLLVM(?:-[^.]+)?\.a$/, /^libLLVM-C(?:-[^.]+)?\.a$/];

  for (const patterns of [preferredNames, fallbackNames]) {
    for (const libDir of libDirs) {
      let names;
      try {
        names = fs.readdirSync(libDir).sort();
      } catch {
        continue;
      }
      for (const pattern of patterns) {
        const name = names.find((entry) => pattern.test(entry));
        if (name) {
          return { libDir, library: path.join(libDir, name) };
        }
      }
    }
  }

  return null;
}

function existsFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function inspectRoot(candidate, source) {
  if (!candidate) {
    return null;
  }

  const root = path.resolve(candidate);
  const header = path.join(root, ...HEADER_PARTS);
  if (!existsFile(header)) {
    record(root, `${source}: missing ${HEADER_PARTS.join("/")}`);
    return null;
  }

  const foundLibrary = libraryIn(root);
  if (!foundLibrary) {
    const expected =
      process.platform === "win32"
        ? "lib/LLVM-C.lib"
        : "a shared or static libLLVM library under lib/ or lib64/";
    record(root, `${source}: missing ${expected}`);
    return null;
  }

  return {
    root,
    includeDir: path.join(root, "include"),
    libDir: foundLibrary.libDir,
    library: foundLibrary.library,
  };
}

function executableNames(base) {
  const suffix = process.platform === "win32" ? ".exe" : "";
  const names = [`${base}${suffix}`];
  const versioned = [];

  for (const entry of (process.env.PATH || "").split(path.delimiter)) {
    if (!entry) {
      continue;
    }
    let files;
    try {
      files = fs.readdirSync(entry);
    } catch {
      continue;
    }
    const pattern = new RegExp(
      `^${base.replace("-", "\\-")}-\\d+(?:\\.\\d+)*${suffix.replace(".", "\\.")}$`,
    );
    for (const file of files) {
      if (pattern.test(file)) {
        versioned.push(file);
      }
    }
  }

  return [...names, ...new Set(versioned.sort().reverse())];
}

function findOnPath(name) {
  for (const entry of (process.env.PATH || "").split(path.delimiter)) {
    if (!entry) {
      continue;
    }
    const candidate = path.join(entry, name);
    if (existsFile(candidate)) {
      return candidate;
    }
  }
  return null;
}

function run(executable, args) {
  const result = childProcess.spawnSync(executable, args, {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    const detail =
      result.error?.message || (result.stderr || "").trim() || `exit ${result.status}`;
    checked.push(`${normalize(executable)} (${args.join(" ")} failed: ${detail})`);
    return null;
  }
  return result.stdout.trim();
}

function rootFromClang(clang) {
  const pathRoot = path.dirname(path.dirname(clang));
  const fromPath = inspectRoot(pathRoot, `PATH clang ${normalize(clang)}`);
  if (fromPath) {
    return fromPath;
  }

  let executable = clang;
  try {
    executable = fs.realpathSync(clang);
  } catch {
    // The PATH entry itself is still useful for normal LLVM bin/ layouts.
  }

  const realRoot = path.dirname(path.dirname(executable));
  const fromRealPath = inspectRoot(realRoot, `real path of clang ${normalize(executable)}`);
  if (fromRealPath) {
    return fromRealPath;
  }

  const resourceDir = run(clang, ["--print-resource-dir"]);
  if (!resourceDir) {
    return null;
  }
  // <root>/lib/clang/<version> is Clang's standard resource directory.
  return inspectRoot(path.resolve(resourceDir, "..", "..", ".."), `clang resource dir ${resourceDir}`);
}

function discover() {
  if (process.env.LLVM_ROOT) {
    const explicit = inspectRoot(process.env.LLVM_ROOT, "LLVM_ROOT");
    if (explicit) {
      return explicit;
    }
    fail("LLVM_ROOT is set but does not name a usable LLVM installation");
  }

  if (process.env.LLVM_CONFIG) {
    const prefix = run(process.env.LLVM_CONFIG, ["--prefix"]);
    const explicit = prefix && inspectRoot(prefix, "LLVM_CONFIG --prefix");
    if (explicit) {
      return explicit;
    }
    fail("LLVM_CONFIG is set but did not identify a usable LLVM installation");
  }

  for (const name of executableNames("llvm-config")) {
    const executable = findOnPath(name);
    if (!executable) {
      continue;
    }
    const prefix = run(executable, ["--prefix"]);
    const found = prefix && inspectRoot(prefix, `${name} --prefix`);
    if (found) {
      return found;
    }
  }

  for (const name of executableNames("clang")) {
    const executable = findOnPath(name);
    if (!executable) {
      continue;
    }
    const found = rootFromClang(executable);
    if (found) {
      return found;
    }
  }

  fail("could not find a usable LLVM installation");
}

function fail(message) {
  const details = checked.length > 0 ? `\nChecked:\n  - ${checked.join("\n  - ")}` : "";
  console.error(
    `resolve_llvm: ${message}.${details}\n` +
      "Set LLVM_ROOT to an LLVM prefix containing include/llvm-c/Core.h and its LLVM library.",
  );
  process.exit(1);
}

const option = process.argv[2] || "--root";
const fields = {
  "--root": "root",
  "--include-dir": "includeDir",
  "--lib-dir": "libDir",
  "--library": "library",
};
if (!Object.hasOwn(fields, option) || process.argv.length > 3) {
  console.error(
    "usage: node resolve_llvm.js [--root|--include-dir|--lib-dir|--library]",
  );
  process.exit(2);
}

const llvm = discover();
console.log(normalize(llvm[fields[option]]));
