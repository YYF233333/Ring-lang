// B-100 P1.3 adversarial: String edge cases + Eq dispatch on strings.
// Tests empty string operations, string methods in generic context,
// and string-heavy collection operations.

fn str_eq_generic<T: Eq>(a: T, b: T) -> Bool { a == b }

fn main() {
    // ── Empty string operations ──
    let e = ""
    print("empty_len=${e.len()}")                      // empty_len=0
    print("empty_contains=${e.contains("x")}")         // empty_contains=false
    print("empty_starts=${e.starts_with("x")}")        // empty_starts=false
    print("empty_ends=${e.ends_with("x")}")            // empty_ends=false
    print("empty_trim=${e.trim()}")                    // empty_trim=
    print("empty_upper=${e.to_upper()}")               // empty_upper=
    print("empty_lower=${e.to_lower()}")               // empty_lower=
    print("empty_replace=${e.replace("a", "b")}")      // empty_replace=
    print("empty_repeat=${e.repeat(5)}")               // empty_repeat=

    // ── Empty string equality ──
    print("empty_eq=${"" == ""}")                      // empty_eq=true
    print("empty_ne=${"" == "x"}")                     // empty_ne=false
    print("empty_generic=${str_eq_generic("", "")}")   // empty_generic=true

    // ── String split edge cases ──
    let csv = "a,b,c"
    let parts = csv.split(",")
    print("split_len=${parts.len()}")                  // split_len=3
    print("split_0=${parts[0]}")                       // split_0=a
    print("split_2=${parts[2]}")                       // split_2=c

    // Split with no match — returns single-element list
    let no_match = "hello".split(",")
    print("no_split_len=${no_match.len()}")            // no_split_len=1
    print("no_split_0=${no_match[0]}")                 // no_split_0=hello

    // ── String index_of ──
    let idx = "hello world".index_of("world")
    print("idx_world=${idx.unwrap_or(-1)}")            // idx_world=6
    let idx2 = "hello".index_of("xyz")
    print("idx_miss=${idx2.is_none()}")                // idx_miss=true

    // ── String slice ──
    let sliced = "hello world".slice(0, 5)
    print("slice=${sliced}")                           // slice=hello

    // ── String contains / starts_with / ends_with ──
    let s = "Ring-lang"
    print("contains_ring=${s.contains("Ring")}")       // contains_ring=true
    print("starts_ring=${s.starts_with("Ring")}")      // starts_ring=true
    print("ends_lang=${s.ends_with("lang")}")          // ends_lang=true
    print("ends_ring=${s.ends_with("Ring")}")          // ends_ring=false

    // ── String in list operations ──
    let words = ["hello", "world", "foo", "bar"]
    let long_words = words.filter(fn(s) { s.len() > 3 })
    print("long_len=${long_words.len()}")              // long_len=2
    print("long_0=${long_words[0]}")                   // long_0=hello
    print("long_1=${long_words[1]}")                   // long_1=world

    let upper_words = words.map(fn(s) { s.to_upper() })
    print("upper_0=${upper_words[0]}")                 // upper_0=HELLO
    print("upper_3=${upper_words[3]}")                 // upper_3=BAR

    let joined = words.join("-")
    print("joined=${joined}")                          // joined=hello-world-foo-bar

    // ── Generic Eq with strings in list ──
    let has = words.contains("foo")
    print("list_contains_str=${has}")                  // list_contains_str=true
    let miss = words.contains("baz")
    print("list_miss_str=${miss}")                     // list_miss_str=false

    // ── String interpolation edge cases ──
    let n = 42
    let interp = "val=${n}"
    print("interp=${interp}")                          // interp=val=42
    let nested = "a=${"b=${"c"}"}"
    print("nested_interp=${nested}")                   // nested_interp=a=b=c

    // ── pad / repeat ──
    let padded = "hi".pad_start(5, "0")
    print("pad_start=${padded}")                       // pad_start=000hi
    let padded2 = "hi".pad_end(5, ".")
    print("pad_end=${padded2}")                        // pad_end=hi...
    let repeated = "ab".repeat(3)
    print("repeat=${repeated}")                        // repeat=ababab

    print("done")
}
