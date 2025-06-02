import * as assert from "assert";
import { ClineAdapter } from "../core/cline-adapter";

suite("ClineAdapter Tests", () => {
  let adapter: ClineAdapter;

  setup(() => {
    adapter = new ClineAdapter();
  });

  teardown(async () => {
    if (adapter) {
      await adapter.dispose();
    }
  });

  test("should create adapter instance", () => {
    assert.ok(adapter);
    assert.strictEqual(adapter.isReady(), false);
    assert.strictEqual(adapter.isInstalled(), false);
    assert.strictEqual(adapter.isActive(), false);
  });

  test("should have correct initial state", () => {
    assert.strictEqual(adapter.getVersion(), undefined);
    assert.strictEqual(adapter.getApi(), undefined);
    assert.deepStrictEqual(adapter.getAvailableFunctions(), []);
  });

  test("should throw error when calling API methods before initialization", async () => {
    try {
      await adapter.startNewTask({ task: "test" });
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.strictEqual((error as Error).message, "Cline API not available");
    }
  });

  test("should throw error when calling custom instructions before initialization", async () => {
    try {
      await adapter.getCustomInstructions();
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.strictEqual((error as Error).message, "Cline API not available");
    }
  });
});
