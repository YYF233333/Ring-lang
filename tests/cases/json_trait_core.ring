fn call_str_json(f: fn(Str) -> Str, value: Str) -> Str {
    f(value)
}

fn call_int_list_json(f: fn(List<Int>) -> Str, value: List<Int>) -> Str {
    f(value)
}

struct ManualRecord {
    label: Str,
    count: Int
}

@derive(Json)
struct DerivedRecord {
    label: Str,
    count: Int
}

@derive(Json)
struct DerivedBox<T> {
    value: T
}

@derive(Json)
enum DerivedEvent {
    Empty,
    Count(Int),
    Named { label: Str, values: List<Int> }
}

@derive(Json)
enum JsonTree {
    Leaf(Int),
    Branch(List<JsonTree>)
}

impl Json for ManualRecord {
    fn to_json(self) -> Str {
        let mut out = string_builder()
        out.add("{\"label\":")
        out.add(json_stringify(self.label))
        out.add(",\"count\":")
        out.add(json_stringify(self.count))
        out.add("}")
        out.to_str()
    }
}

fn encode<T: Json>(value: T) -> Str {
    json_stringify(value)
}

fn ascii_byte(code: Int) -> Str {
    let buf = ring_buf_alloc(1)
    ring_buf_set_byte(buf, 0, code)
    let value = ring_str_from_ptr(buf, 1)
    ring_buf_dealloc(buf)
    value
}

fn main() {
    assert(json_stringify(42) == "42", "Int Json")
    let direct_method = 7
    assert(direct_method.to_json() == "7", "direct Json trait method")
    assert(json_stringify(-17) == "-17", "negative Int Json")
    assert(json_stringify(3.0) == "3", "integer-like Float Json")
    assert(json_stringify(-0.0) == "0", "negative zero Float Json")
    assert(json_stringify(1.25) == "1.25", "fractional Float Json")
    assert(json_stringify(0.0 / 0.0) == "null", "NaN Float Json")
    assert(json_stringify(1.0 / 0.0) == "null", "positive infinity Float Json")
    assert(json_stringify(-1.0 / 0.0) == "null", "negative infinity Float Json")
    assert(json_stringify(true) == "true", "true Bool Json")
    assert(json_stringify(false) == "false", "false Bool Json")

    assert(json_stringify("quote=\" slash=\\ newline=\n return=\r tab=\t") ==
        "\"quote=\\\" slash=\\\\ newline=\\n return=\\r tab=\\t\"",
        "Str Json escaping")
    assert(json_stringify(ascii_byte(8)) == "\"\\b\"", "backspace Str Json")
    assert(json_stringify(ascii_byte(12)) == "\"\\f\"", "form feed Str Json")
    assert(json_stringify(ascii_byte(1)) == "\"\\u0001\"",
        "low control Str Json")
    assert(json_stringify(ascii_byte(31)) == "\"\\u001f\"",
        "hex control Str Json")
    assert(json_stringify("雪🌟") == "\"雪🌟\"",
        "non-ASCII UTF-8 Str Json")
    assert(json_stringify("") == "\"\"", "empty Str Json")
    assert(json_stringify(["a", "b"]) == "[\"a\",\"b\"]", "Str List Json")
    assert(json_stringify([1, 2, 3]) == "[1,2,3]", "compact Int List Json")
    assert(json_stringify([[1, 2], [], [3]]) == "[[1,2],[],[3]]",
        "nested List Json preserves order")
    assert(json_stringify(ManualRecord { label: "item", count: 2 }) ==
        "{\"label\":\"item\",\"count\":2}",
        "user type can implement public Json")
    assert(encode(ManualRecord { label: "generic", count: 3 }) ==
        "{\"label\":\"generic\",\"count\":3}",
        "generic Json bound forwards evidence")
    assert(json_stringify(DerivedRecord { label: "item", count: 2 }) ==
        "{\"label\":\"item\",\"count\":2}",
        "derived struct preserves field order")
    assert(json_stringify(DerivedBox { value: [4, 5] }) ==
        "{\"value\":[4,5]}",
        "generic derived struct forwards field evidence")
    assert(json_stringify(Empty) == "{\"_tag\":\"Empty\"}",
        "derived fieldless enum preserves tag shape")
    assert(json_stringify(Count(3)) == "{\"_tag\":\"Count\",\"_0\":3}",
        "derived positional enum preserves positional key")
    assert(json_stringify(Named { label: "n", values: [1, 2] }) ==
        "{\"_tag\":\"Named\",\"label\":\"n\",\"values\":[1,2]}",
        "derived named enum preserves field keys")
    assert(json_stringify(Branch([Leaf(1), Branch([Leaf(2)])])) ==
        "{\"_tag\":\"Branch\",\"_0\":[{\"_tag\":\"Leaf\",\"_0\":1},{\"_tag\":\"Branch\",\"_0\":[{\"_tag\":\"Leaf\",\"_0\":2}]}]}",
        "recursive Json derive resolves its own dictionary")

    assert(call_str_json(json_stringify, "raw") == "\"raw\"",
        "first-class Json function retains Str evidence")
    assert(call_int_list_json(json_stringify, [4, 5]) == "[4,5]",
        "first-class Json function retains List<Int> evidence")

    print("json trait core: all tests passed")
}
