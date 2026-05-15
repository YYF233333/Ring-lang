-- Ring-lang: Effect system demo
-- 展示 4 层错误处理甜度和 effect handler

struct Config {
    host: Str,
    port: Int where 1024 < it < 65536,
}

-- 层级 0：冒泡（零语法，effect 自动传播）
fn load_config(path: Str) -> Config {
    let raw = io.read(path)
    let table = toml.parse(raw)
    Config {
        host: table.get("host"),
        port: table.get_int("port"),
    }
}

-- 层级 1：or 兜底
fn get_config() -> Config {
    load_config("custom.toml") or load_config("default.toml")
}

-- 层级 2：catch 轻量捕获
fn get_port(path: Str) -> Int {
    let config = load_config(path) catch fn(e) {
        Config { host: "localhost", port: 8080 }
    }
    config.port
}

-- 层级 4：完整 handler（测试 mock）
test "load_config parses correctly" {
    let mock_toml = r#"host = "example.com"\nport = 3000"#

    handle {
        let config = load_config("fake.toml")
        assert(config.port == 3000)
        assert(config.host == "example.com")
    } with {
        io.read(_path) => mock_toml,
        fail(e) => panic("unexpected: ${e}"),
    }
}

-- 入口
fn main() {
    handle {
        let config = get_config()
        print("Server at ${config.host}:${config.port}")
    } with {
        fail(e) => { print("Error: ${e}"); exit(1) },
        io => perform,
    }
}
