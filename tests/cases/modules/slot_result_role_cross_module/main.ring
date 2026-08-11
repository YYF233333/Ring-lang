use facade::{reader_factory, taker_factory, reader_alias, taker_alias}

fn main() {
    let imported_reader = reader_factory()
    let read_values = ["cross-read"]
    let read_value = imported_reader(read_values.buf, 0)

    let imported_taker = taker_factory()
    let mut take_values = ["cross-take"]
    let take_value = imported_taker(take_values.buf, 0)

    let alias_read_values = ["alias-read"]
    let alias_read = reader_alias(alias_read_values.buf, 0)
    let mut alias_take_values = ["alias-take"]
    let alias_take = taker_alias(alias_take_values.buf, 0)

    print("${read_value}|${take_value}|${alias_read}|${alias_take}")
}
