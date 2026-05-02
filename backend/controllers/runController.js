/* =========================================================
   runController.js
   Executes user code in a sandboxed child process
   Supports: JavaScript, Python, TypeScript, Java, C++
========================================================= */

const { execFile, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const TIMEOUT_MS = 10000; // 10 second execution limit
const MAX_OUTPUT = 50000; // 50KB output limit

/* ---------- Language Configurations ---------- */
const LANGUAGE_CONFIG = {
    javascript: {
        extension: ".js",
        command: "node",
        args: (filePath) => [filePath],
        available: true,
    },
    python: {
        extension: ".py",
        command: process.platform === "win32" ? "python" : "python3",
        args: (filePath) => [filePath],
        available: true,
    },
    typescript: {
        extension: ".ts",
        command: "npx",
        args: (filePath) => ["tsx", filePath],
        available: true,
    },
    java: {
        extension: ".java",
        // Java needs compile then run — handled specially
        compile: true,
        available: true,
    },
    cpp: {
        extension: ".cpp",
        // C++ needs compile then run — handled specially
        compile: true,
        available: true,
    },
};

/* ---------- Temp File Helpers ---------- */
function createTempFile(code, extension) {
    const tmpDir = os.tmpdir();
    const fileName = `cra_run_${Date.now()}${extension}`;
    const filePath = path.join(tmpDir, fileName);
    fs.writeFileSync(filePath, code, "utf8");
    return filePath;
}

function cleanupFiles(...files) {
    files.forEach((f) => {
        try {
            if (f && fs.existsSync(f)) fs.unlinkSync(f);
        } catch (_) {
            /* ignore cleanup errors */
        }
    });
}

/* ---------- Execute a Process ---------- */
function runProcess(command, args, timeoutMs) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        let stdout = "";
        let stderr = "";
        let killed = false;

        const proc = spawn(command, args, {
            timeout: timeoutMs,
            stdio: ["pipe", "pipe", "pipe"],
            shell: process.platform === "win32",
        });

        proc.stdout.on("data", (data) => {
            stdout += data.toString();
            if (stdout.length > MAX_OUTPUT) {
                stdout = stdout.slice(0, MAX_OUTPUT) + "\n...[output truncated]";
                proc.kill();
                killed = true;
            }
        });

        proc.stderr.on("data", (data) => {
            stderr += data.toString();
            if (stderr.length > MAX_OUTPUT) {
                stderr = stderr.slice(0, MAX_OUTPUT) + "\n...[output truncated]";
                proc.kill();
                killed = true;
            }
        });

        proc.on("close", (code) => {
            const executionTime = Date.now() - startTime;
            resolve({ stdout, stderr, exitCode: code, executionTime, killed });
        });

        proc.on("error", (err) => {
            const executionTime = Date.now() - startTime;
            resolve({
                stdout: "",
                stderr: err.message,
                exitCode: 1,
                executionTime,
                killed: false,
            });
        });
    });
}

/* ---------- Java: Compile + Run ---------- */
async function runJava(code) {
    // Extract class name from code, default to "Main"
    const classMatch = code.match(/public\s+class\s+(\w+)/);
    const className = classMatch ? classMatch[1] : "Main";

    // If no public class found, wrap in Main
    let javaCode = code;
    if (!classMatch) {
        javaCode = `public class Main {\n    public static void main(String[] args) {\n${code}\n    }\n}`;
    }

    const tmpDir = os.tmpdir();
    const filePath = path.join(tmpDir, `${className}.java`);
    fs.writeFileSync(filePath, javaCode, "utf8");

    // Compile
    const compileResult = await runProcess("javac", [filePath], TIMEOUT_MS);
    if (compileResult.exitCode !== 0) {
        cleanupFiles(filePath);
        return {
            success: false,
            output: "",
            error: compileResult.stderr || "Compilation failed",
            executionTime: compileResult.executionTime,
            phase: "compilation",
        };
    }

    // Run
    const classFile = path.join(tmpDir, `${className}.class`);
    const result = await runProcess("java", ["-cp", tmpDir, className], TIMEOUT_MS);
    cleanupFiles(filePath, classFile);

    return {
        success: result.exitCode === 0,
        output: result.stdout,
        error: result.stderr,
        executionTime: compileResult.executionTime + result.executionTime,
        phase: "execution",
    };
}

/* ---------- C++: Compile + Run ---------- */
async function runCpp(code) {
    const tmpDir = os.tmpdir();
    const srcPath = path.join(tmpDir, `cra_run_${Date.now()}.cpp`);
    const outPath = path.join(
        tmpDir,
        `cra_run_${Date.now()}${process.platform === "win32" ? ".exe" : ""}`
    );
    fs.writeFileSync(srcPath, code, "utf8");

    // Compile with g++
    const compileResult = await runProcess(
        "g++",
        [srcPath, "-o", outPath, "-std=c++17"],
        TIMEOUT_MS
    );
    if (compileResult.exitCode !== 0) {
        cleanupFiles(srcPath);
        return {
            success: false,
            output: "",
            error: compileResult.stderr || "Compilation failed",
            executionTime: compileResult.executionTime,
            phase: "compilation",
        };
    }

    // Run
    const result = await runProcess(outPath, [], TIMEOUT_MS);
    cleanupFiles(srcPath, outPath);

    return {
        success: result.exitCode === 0,
        output: result.stdout,
        error: result.stderr,
        executionTime: compileResult.executionTime + result.executionTime,
        phase: "execution",
    };
}

/* ---------- Main Execute Handler ---------- */
exports.executeCode = async (req, res, next) => {
    try {
        const { code, language } = req.body;
        const lang = language.toLowerCase();

        const config = LANGUAGE_CONFIG[lang];
        if (!config) {
            return res.status(400).json({
                success: false,
                error: `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_CONFIG).join(", ")}`,
            });
        }

        let result;

        // Handle compiled languages specially
        if (lang === "java") {
            result = await runJava(code);
        } else if (lang === "cpp") {
            result = await runCpp(code);
        } else {
            // Interpreted languages: JS, Python, TypeScript
            const filePath = createTempFile(code, config.extension);
            const procResult = await runProcess(
                config.command,
                config.args(filePath),
                TIMEOUT_MS
            );
            cleanupFiles(filePath);

            result = {
                success: procResult.exitCode === 0,
                output: procResult.stdout,
                error: procResult.stderr,
                executionTime: procResult.executionTime,
                phase: "execution",
            };
        }

        // Parse error messages for line numbers
        const errors = parseErrors(result.error, lang);

        res.json({
            success: result.success,
            output: result.output || "",
            error: result.error || "",
            errors: errors,
            executionTime: result.executionTime,
            phase: result.phase || "execution",
        });
    } catch (err) {
        next(err);
    }
};

/* ---------- Error Parser ---------- */
function parseErrors(stderr, language) {
    if (!stderr) return [];
    const errors = [];
    const lines = stderr.split("\n");

    lines.forEach((line) => {
        let match;

        // JavaScript/Node.js errors: "file.js:LINE"
        if (language === "javascript" || language === "typescript") {
            match = line.match(/:(\d+)(?::(\d+))?\s*$/);
            if (!match) match = line.match(/at.*:(\d+):(\d+)/);
        }

        // Python errors: "File "...", line N"
        if (language === "python") {
            match = line.match(/line\s+(\d+)/i);
        }

        // Java errors: "FileName.java:LINE: error:"
        if (language === "java") {
            match = line.match(/\.java:(\d+):/);
        }

        // C++ errors: "file.cpp:LINE:COL: error:"
        if (language === "cpp") {
            match = line.match(/\.cpp:(\d+)(?::(\d+))?:/);
        }

        if (match) {
            errors.push({
                line: parseInt(match[1], 10),
                column: match[2] ? parseInt(match[2], 10) : null,
                message: line.trim(),
            });
        }
    });

    return errors;
}
