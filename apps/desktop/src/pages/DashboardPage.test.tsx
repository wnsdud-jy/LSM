import { render, screen } from "@testing-library/react";
import { DashboardPage } from "./DashboardPage";

it("renders cpu and memory cards", () => {
  render(<DashboardPage />);
  expect(screen.getByText("CPU")).toBeDefined();
  expect(screen.getByText("RAM")).toBeDefined();
});
