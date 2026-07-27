pub effect FileDefault {
    fn value() -> Int {
        101
    }
}

pub mod child {
    pub effect InlineDefault {
        fn value() -> Int {
            202
        }
    }

    pub fn read() -> Int {
        InlineDefault.value()
    }
}

pub fn file_default() -> Int {
    FileDefault.value()
}

pub fn inline_default() -> Int {
    child::read()
}
