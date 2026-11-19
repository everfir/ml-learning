import assert from "node:assert/strict";
import test from "node:test";
import { lessonHref, parseRoute, sections } from "../src/shared/lesson-route.ts";

test("离线地址能同时还原正文与侧栏中的段落", () => {
  for (const section of sections) {
    const page =
      section === "workbench" || section === "records"
        ? { section }
        : { section, anchor: "example" };
    const guide = { section, anchor: "second" };
    assert.deepEqual(parseRoute(lessonHref(page, guide, "neuron"), "neuron"), { page, guide });
  }
});
test("空地址、其他实验及未知章节回到工作台，错误侧栏保留正文", () => {
  for (const hash of ["", "#/another/theory", "#/neuron/nope", "#/neuron/theory/x/y"]) {
    assert.deepEqual(parseRoute(hash, "neuron"), { page: { section: "workbench" } });
  }
  assert.deepEqual(parseRoute("#/neuron/theory/weights?guide=unknown", "neuron"), {
    page: { section: "theory", anchor: "weights" },
  });
});

test("工作台和记录旧段落链接在对应页面打开资料侧栏", () => {
  for (const section of ["workbench", "records"]) {
    assert.deepEqual(parseRoute(`#/neuron/${section}/example`, "neuron"), {
      page: { section },
      guide: { section, anchor: "example" },
    });
  }
});
