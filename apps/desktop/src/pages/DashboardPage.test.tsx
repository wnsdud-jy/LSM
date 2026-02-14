import { render, screen } from "@testing-library/react";
import { DashboardPage } from "./DashboardPage";

it("renders cpu and memory cards", () => {
  render(<DashboardPage />);
  expect(screen.getByText("CPU")).toBeInTheDocument();
  expect(screen.getByText("RAM")).toBeInTheDocument();
});
