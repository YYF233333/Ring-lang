#!/usr/bin/env python3
"""
B-151 P1: Extract expected outputs from e2e.test.ts into standalone files.

One-time extraction script. Parses the 4 data arrays in e2e.test.ts:
  - cases          (~182)  -> tests/cases/<file>.expected
  - negative_cases (~89)   -> tests/cases/<file>.error
  - module_cases   (17)    -> tests/cases/modules/<dir>/main.expected
  - module_negative (6)    -> tests/cases/modules/<dir>/main.error

All output files use LF line endings (no CRLF).
"""

import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
E2E_FILE = os.path.join(SCRIPT_DIR, "e2e.test.ts")
CASES_DIR = os.path.join(SCRIPT_DIR, "cases")
MODULES_DIR = os.path.join(SCRIPT_DIR, "cases", "modules")


def unescape_js_string(s: str) -> str:
    """Convert JS string escape sequences to actual characters."""
    result = []
    i = 0
    while i < len(s):
        if s[i] == '\\' and i + 1 < len(s):
            c = s[i + 1]
            if c == 'n':
                result.append('\n')
                i += 2
            elif c == 't':
                result.append('\t')
                i += 2
            elif c == 'r':
                result.append('\r')
                i += 2
            elif c == '\\':
                result.append('\\')
                i += 2
            elif c == '"':
                result.append('"')
                i += 2
            elif c == "'":
                result.append("'")
                i += 2
            elif c == '0':
                result.append('\0')
                i += 2
            else:
                result.append(s[i])
                i += 1
        else:
            result.append(s[i])
            i += 1
    return ''.join(result)


def extract_array_block(source: str, start_marker: str) -> str:
    """Extract the text of an array from its opening '[' to its closing '];'.

    The start_marker should end with '[' (the opening bracket of the array).
    We find the marker and then start bracket counting from the '[' at its end.
    """
    idx = source.find(start_marker)
    if idx == -1:
        raise ValueError(f"Could not find marker: {start_marker}")
    # The marker includes the opening '[', so bracket_start is at the end of marker
    bracket_start = idx + len(start_marker) - 1
    assert source[bracket_start] == '[', (
        f"Expected '[' at end of marker, got '{source[bracket_start]}'"
    )
    # Walk forward counting brackets, skipping string contents
    depth = 0
    i = bracket_start
    in_string = False
    string_char = None
    while i < len(source):
        c = source[i]
        if in_string:
            if c == '\\':
                i += 2  # skip escaped char
                continue
            if c == string_char:
                in_string = False
        else:
            if c == '"' or c == "'":
                in_string = True
                string_char = c
            elif c == '[':
                depth += 1
            elif c == ']':
                depth -= 1
                if depth == 0:
                    return source[bracket_start:i + 1]
        i += 1
    raise ValueError(f"Unmatched bracket for marker: {start_marker}")


def parse_positive_cases(block: str) -> list[tuple[str, str]]:
    """Parse { file: "xxx.ring", expected: "yyy" } entries."""
    pattern = re.compile(
        r'\{\s*file:\s*"([^"]+)"\s*,\s*expected:\s*"((?:[^"\\]|\\.)*)"\s*\}',
        re.DOTALL
    )
    results = []
    for m in pattern.finditer(block):
        filename = m.group(1)
        expected_raw = m.group(2)
        expected = unescape_js_string(expected_raw)
        results.append((filename, expected))
    return results


def parse_negative_cases(block: str) -> list[tuple[str, str]]:
    """Parse { file: "xxx.ring", error_pattern: "E0301" } entries."""
    pattern = re.compile(
        r'\{\s*file:\s*"([^"]+)"\s*,\s*error_pattern:\s*"((?:[^"\\]|\\.)*)"\s*\}'
    )
    results = []
    for m in pattern.finditer(block):
        filename = m.group(1)
        error_pattern = m.group(2)
        results.append((filename, error_pattern))
    return results


def parse_module_positive(block: str) -> list[tuple[str, str]]:
    """Parse { dir: "xxx", expected: "yyy" } entries."""
    pattern = re.compile(
        r'\{\s*dir:\s*"([^"]+)"\s*,\s*expected:\s*"((?:[^"\\]|\\.)*)"\s*\}'
    )
    results = []
    for m in pattern.finditer(block):
        dirname = m.group(1)
        expected_raw = m.group(2)
        expected = unescape_js_string(expected_raw)
        results.append((dirname, expected))
    return results


def parse_module_negative(block: str) -> list[tuple[str, str, str]]:
    """Parse { dir: "xxx", desc: "yyy", error_pattern: "zzz" } entries."""
    pattern = re.compile(
        r'\{\s*dir:\s*"([^"]+)"\s*,\s*desc:\s*"[^"]*"\s*,\s*error_pattern:\s*"((?:[^"\\]|\\.)*)"\s*\}'
    )
    results = []
    for m in pattern.finditer(block):
        dirname = m.group(1)
        error_pattern = m.group(2)
        results.append((dirname, error_pattern))
    return results


def write_file_lf(filepath: str, content: str) -> None:
    """Write content with LF line endings (binary mode)."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    # Ensure only LF, never CRLF
    content_lf = content.replace('\r\n', '\n')
    with open(filepath, 'wb') as f:
        f.write(content_lf.encode('utf-8'))


def main():
    with open(E2E_FILE, 'r', encoding='utf-8') as f:
        source = f.read()

    stats = {
        'cases_expected': 0,
        'negative_error': 0,
        'module_expected': 0,
        'module_error': 0,
    }

    # 1. Positive cases -> .expected files
    cases_block = extract_array_block(source, 'const cases: TestCase[] = [')
    cases = parse_positive_cases(cases_block)
    print(f"Found {len(cases)} positive cases")
    for filename, expected in cases:
        # filename is like "hello.ring" -> tests/cases/hello.expected
        base = filename.rsplit('.', 1)[0]
        out_path = os.path.join(CASES_DIR, base + '.expected')
        write_file_lf(out_path, expected)
        stats['cases_expected'] += 1

    # 2. Negative cases -> .error files
    neg_block = extract_array_block(source, 'const negative_cases = [')
    neg_cases = parse_negative_cases(neg_block)
    print(f"Found {len(neg_cases)} negative cases")
    for filename, error_pattern in neg_cases:
        # filename may have subdirs like "negative/struct_update_wrong_type.ring"
        base = filename.rsplit('.', 1)[0]
        out_path = os.path.join(CASES_DIR, base + '.error')
        write_file_lf(out_path, error_pattern)
        stats['negative_error'] += 1

    # 3. Module positive cases -> main.expected
    mod_block = extract_array_block(source, 'const module_cases: ModuleTestCase[] = [')
    mod_cases = parse_module_positive(mod_block)
    print(f"Found {len(mod_cases)} module positive cases")
    for dirname, expected in mod_cases:
        out_path = os.path.join(MODULES_DIR, dirname, 'main.expected')
        write_file_lf(out_path, expected)
        stats['module_expected'] += 1

    # 4. Module negative cases -> main.error
    mod_neg_block = extract_array_block(source, 'const module_negative_cases = [')
    mod_neg_cases = parse_module_negative(mod_neg_block)
    print(f"Found {len(mod_neg_cases)} module negative cases")
    for dirname, error_pattern in mod_neg_cases:
        out_path = os.path.join(MODULES_DIR, dirname, 'main.error')
        write_file_lf(out_path, error_pattern)
        stats['module_error'] += 1

    total = sum(stats.values())
    print(f"\n=== Summary ===")
    print(f"  Positive .expected files:        {stats['cases_expected']}")
    print(f"  Negative .error files:           {stats['negative_error']}")
    print(f"  Module positive .expected files: {stats['module_expected']}")
    print(f"  Module negative .error files:    {stats['module_error']}")
    print(f"  Total files generated:           {total}")


if __name__ == '__main__':
    main()
