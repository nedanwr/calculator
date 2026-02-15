import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InputField } from "~/components/input-field";

describe("InputField", () => {
  it("renders with label", () => {
    render(<InputField label="Amount" value={100} onChange={() => {}} />);
    expect(screen.getByText("Amount")).toBeInTheDocument();
  });

  it("displays formatted number with commas", () => {
    render(<InputField label="Amount" value={1000000} onChange={() => {}} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("1,000,000");
  });

  it("calls onChange when input changes", () => {
    const handleChange = vi.fn();
    render(<InputField label="Amount" value={100} onChange={handleChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "200" } });
    expect(handleChange).toHaveBeenCalledWith(200);
  });

  it("handles decimal input when decimals prop is set", () => {
    const handleChange = vi.fn();
    render(
      <InputField
        label="Amount"
        value={100}
        onChange={handleChange}
        decimals={2}
      />
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "100.50" } });
    expect(handleChange).toHaveBeenCalledWith(100.5);
  });

  it("rejects decimals when decimals is 0", () => {
    const handleChange = vi.fn();
    render(
      <InputField
        label="Amount"
        value={100}
        onChange={handleChange}
        decimals={0}
      />
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "100.50" } });
    expect(handleChange).toHaveBeenCalledWith(100);
  });

  it("enforces min constraint on blur", () => {
    const handleChange = vi.fn();
    render(
      <InputField label="Amount" value={100} onChange={handleChange} min={10} />
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.blur(input);
    expect(handleChange).toHaveBeenCalledWith(10);
  });

  it("enforces max constraint during input", () => {
    const handleChange = vi.fn();
    render(
      <InputField
        label="Amount"
        value={100}
        onChange={handleChange}
        max={1000}
      />
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "2000" } });
    expect(handleChange).toHaveBeenCalledWith(1000);
  });

  it("displays prefix when provided", () => {
    render(
      <InputField label="Price" value={100} onChange={() => {}} prefix="$" />
    );
    expect(screen.getByText("$")).toBeInTheDocument();
  });

  it("displays suffix when provided", () => {
    render(
      <InputField label="Rate" value={5} onChange={() => {}} suffix="%" />
    );
    expect(screen.getByText("%")).toBeInTheDocument();
  });

  it("handles negative numbers when allowNegative is true", () => {
    const handleChange = vi.fn();
    render(
      <InputField
        label="Amount"
        value={100}
        onChange={handleChange}
        allowNegative
        min={-1000}
      />
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "-50" } });
    expect(handleChange).toHaveBeenCalled();
    const calledValue = handleChange.mock.calls[0][0];
    expect(calledValue).toBeLessThan(0);
  });

  it("generates unique id when not provided", () => {
    render(<InputField label="Test" value={100} onChange={() => {}} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id");
    const label = screen.getByText("Test");
    expect(label).toHaveAttribute("for", input.id);
  });

  it("uses provided id", () => {
    render(
      <InputField label="Test" value={100} onChange={() => {}} id="custom-id" />
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id", "custom-id");
  });
});
