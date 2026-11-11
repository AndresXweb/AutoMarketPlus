import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VerifiedBadge } from "./verified-badge";

describe("VerifiedBadge", () => {
  // Caso feliz: renderiza el texto por defecto
  it("muestra el texto 'Verificado' por defecto", () => {
    render(<VerifiedBadge />);
    expect(screen.getByText("Verificado")).toBeInTheDocument();
  });

  // Caso con label personalizado
  it("muestra el label personalizado cuando se pasa", () => {
    render(<VerifiedBadge label="Vendedor verificado" />);
    expect(screen.getByText("Vendedor verificado")).toBeInTheDocument();
    expect(screen.queryByText("Verificado")).not.toBeInTheDocument();
  });

  // Caso de estructura: contiene el icono (svg)
  it("incluye un icono SVG (BadgeCheck)", () => {
    const { container } = render(<VerifiedBadge />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });
});
