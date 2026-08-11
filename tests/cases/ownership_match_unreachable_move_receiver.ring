struct Token { text: Str }

impl Token {
    fn into_length(move self) -> Int {
        self.text.len()
    }
}

fn consume_selected(value: Token, enabled: Bool) -> Int {
    let selected = match enabled {
        true => value,
        false => return 0,
    }
    selected.into_length()
}

fn main() {
    print(consume_selected(Token { text: "match" }, true))
    print(consume_selected(Token { text: "unused" }, false))
}
