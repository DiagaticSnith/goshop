test('intentional failing test to exercise CI failure path', () => {
  // This test is intentionally wrong to trigger a failure in CI
  expect(1 + 1).toBe(3);
});

export {};
