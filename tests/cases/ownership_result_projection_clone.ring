struct Token { id: Int }

impl Drop for Token {
    fn drop(self) {}
}

fn inspect_token(value: Token) -> Int { value.id }

fn advance_token(value: Token) -> Result<Int, Str> {
    Result::Ok(value.id + 1)
}

fn fail_text() -> Int with {fail<Str>} {
    fail.raise("caught")
}

fn main() {
    let mapped: Result<Int, Str> =
        Result::Ok(Token { id: 7 }).map(inspect_token)
    match mapped {
        Result::Ok(value) => print(value),
        Result::Err(message) => print(message),
    }

    let chained: Result<Int, Str> =
        Result::Ok(Token { id: 7 }).and_then(advance_token)
    match chained {
        Result::Ok(value) => print(value),
        Result::Err(message) => print(message),
    }

    let missing: Result<Int, Str> = Result::Err("missing")
    print(missing.unwrap_or(9))

    let caught = to_result(fail_text)
    match caught {
        Result::Ok(value) => print(value),
        Result::Err(message) => print(message),
    }
}
