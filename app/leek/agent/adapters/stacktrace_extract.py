#!/usr/bin/env python3
import re
from pathlib import Path


# ---------------- Utilities ----------------

def init_out(raw, lang="unknown"):
    return {
        "lang": lang,
        "error": {"type": "", "message": ""},
        "stack": [],  # [{function, file, module, line}]
        "trace": {
            "raw": raw,
            "text": raw,
            "wc": raw,
        }
    }


def make_frame(file=None, function=None, line=None):
    file = file or ""
    function = function or ""
    line = int(line) if isinstance(line, str) and line.isdigit() else (line if isinstance(line, int) else None)
    module = Path(file).stem if file else ""
    return {"function": function, "file": file, "module": module, "line": line}


def add_frame(out, file, func, line):
    return
    # TODO: will add support for stack frame soon
    out["stack"].append(make_frame(file, func, line))


def dedupe_frames(frames):
    seen = set()
    uniq = []
    for f in frames:
        key = (f.get("function", ""), f.get("file", ""), f.get("module", ""), f.get("line", None))
        if key not in seen:
            seen.add(key)
            uniq.append(f)
    return uniq


# ---------------- Language Parsers ----------------
# Each parser returns an output dict or None.

# ===== Python =====
PY_HEADER = re.compile(r'^\s*Traceback \(most recent call last\):', re.M)
PY_FRAME = re.compile(r'^\s*File "([^"]+)", line (\d+), in (.+)$', re.M)
PY_FINAL = re.compile(r'^\s*([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*):\s*(.*)$')


def parse_python(raw):
    if not PY_HEADER.search(raw):
        return None
    out = init_out(raw, "python")

    # TODO: will add support for stack frame soon
    # for m in PY_FRAME.finditer(raw):
    #     add_frame(out, m.group(1), m.group(3).strip(), m.group(2))

    # final line usually "TypeError: msg"
    tail = raw.strip().splitlines()[-1]
    m = PY_FINAL.match(tail)
    if m:
        out["error"]["type"] = m.group(1)
        out["error"]["message"] = m.group(2)
    return out


# ===== Node.js / JavaScript =====
NODE_HEAD = re.compile(r'^\s*([A-Za-z_]\w*Error|Error):\s*(.*)$', re.M)
NODE_FRAME = re.compile(
    r'^\s*at\s+(?:(.*?)\s+\()?((?:[A-Za-z]:)?[^():\n]+):(\d+):\d+\)?\s*$', re.M)


def parse_node(raw):
    mh = NODE_HEAD.search(raw)
    if not mh:
        return None
    out = init_out(raw, "node")
    out["error"]["type"] = mh.group(1)
    out["error"]["message"] = mh.group(2)
    for fm in NODE_FRAME.finditer(raw):
        func, file, line = fm.groups()
        add_frame(out, file, (func or "<anonymous>").strip(), line)
    return out


# ===== Go =====
# Typical panic/backtrace:
# panic: <message>
# goroutine 1 [running]:
# main.main()
#     /path/main.go:12 +0x20
# or runtime stacks with many goroutines.
GO_HEAD = re.compile(r'^(panic|fatal error):\s*(.*)$', re.M)
GO_FUNC = re.compile(r'^\s*([A-Za-z0-9_./()\-]+)\(\)\s*$', re.M)
GO_FILE = re.compile(r'^\s*(\S+\.go):(\d+)\b', re.M)


def parse_go(raw):
    # Accept either explicit panic/fatal or a strong hint: ".go:<line>" and goroutine header
    mh = GO_HEAD.search(raw)
    looks_like_go = mh or ("goroutine " in raw and re.search(r'\.go:\d+\b', raw))
    if not looks_like_go:
        return None
    out = init_out(raw, "go")
    if mh:
        out["error"]["type"] = mh.group(1)
        out["error"]["message"] = mh.group(2)

    # Strategy: pair by order — many Go traces alternate function line then file:line
    funcs = [m.group(1) for m in GO_FUNC.finditer(raw)]
    files = [m.groups() for m in GO_FILE.finditer(raw)]  # [(file, line), ...]

    # If numbers mismatch, still emit what we have (best-effort)
    fi = 0
    for idx, (file, line) in enumerate(files):
        func = funcs[idx] if idx < len(funcs) else ""
        add_frame(out, file, func, line)
        fi += 1

    # If there were func lines beyond file lines (rare), add them with empty file
    for extra in funcs[fi:]:
        add_frame(out, "", extra, None)

    return out if out["stack"] or out["error"]["type"] else None


# ===== Rust =====
# With RUST_BACKTRACE=1:
# thread 'main' panicked at 'msg', src/main.rs:10:5
# stack backtrace:
#    0: <func path> ...
#              at /rustc/.../library/core/...rs:XYZ
#    1: my_crate::module::func
#              at src/lib.rs:42:9
RUST_PANIC = re.compile(r"thread '.*' panicked at '(.*?)', ([^:]+):(\d+):(\d+)", re.M)
RUST_FRAME_LINE = re.compile(r'^\s*\d+:\s+(.*?)\s*$', re.M)
RUST_AT_FILE = re.compile(r'^\s*at\s+(.+?):(\d+):\d+\s*$', re.M)


def parse_rust(raw):
    mh = RUST_PANIC.search(raw)
    if not mh and "stack backtrace:" not in raw:
        return None
    out = init_out(raw, "rust")
    if mh:
        out["error"]["type"] = "panic"
        out["error"]["message"] = mh.group(1)
        add_frame(out, mh.group(2), "<panic>", mh.group(3))

    # Parse backtrace frames if present
    # We collect lines starting with index, then look for following "at file:line:col"
    # The typical block for one frame is:
    #   N: <symbol or path>
    #        at <file>:<line>:<col>
    sym_iter = list(RUST_FRAME_LINE.finditer(raw))
    at_iter = list(RUST_AT_FILE.finditer(raw))

    # Heuristic pairing by order
    j = 0
    for i in range(len(sym_iter)):
        sym = sym_iter[i].group(1).strip()
        file = ""
        line = None
        # find the next "at ..." that appears after this symbol line
        while j < len(at_iter) and at_iter[j].start() < sym_iter[i].end():
            j += 1
        if j < len(at_iter):
            file = at_iter[j].group(1).strip()
            line = at_iter[j].group(2)
            j += 1
        # Some symbols include "::" path; treat as function
        func = sym if sym and not sym.startswith("at ") else ""
        if file or func:
            add_frame(out, file, func, line)

    return out if out["stack"] or out["error"]["type"] else None


# ===== Ruby =====
# Top:
# file.rb:10:in `foo': boom (RuntimeError)
# from file.rb:14:in `main'
RUBY_HEAD = re.compile(r'^(.*):(\d+):in\s+`(.*?)\':\s*(.*)\s+$begin:math:text$(.*?)$end:math:text$', re.M)
RUBY_FRAME = re.compile(r'^\s*from\s+(.*):(\d+):in\s+`(.*?)\'', re.M)


def parse_ruby(raw):
    mh = RUBY_HEAD.search(raw)
    if not mh:
        return None
    out = init_out(raw, "ruby")
    add_frame(out, mh.group(1), mh.group(3), mh.group(2))
    out["error"]["type"] = mh.group(5)
    out["error"]["message"] = mh.group(4)
    for fm in RUBY_FRAME.finditer(raw):
        add_frame(out, fm.group(1), fm.group(3), fm.group(2))
    return out


# TODO: will add support for other languages soon
PARSERS = [parse_python]  # [parse_python, parse_node, parse_go, parse_rust, parse_ruby]


def detect_and_parse(raw):
    # Try all parsers; return the one that yields most frames or clearly identifies error
    candidates = []
    for p in PARSERS:
        try:
            res = p(raw)
            if res:
                score = len(res["stack"]) + (2 if res["error"]["type"] else 0)
                candidates.append((score, res))
        except Exception:
            pass
    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]
    return init_out(raw, "unknown")


# ---------------- CLI ----------------

def extract_stacktrace(raw: str, dedupe_duplicate_frames: bool = False):
    out = detect_and_parse(raw)

    if dedupe_duplicate_frames:
        out["stack"] = dedupe_frames(out["stack"])

    return out
