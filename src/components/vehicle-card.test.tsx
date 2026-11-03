import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VehicleCard } from "./vehicle-card";
import type { Vehicle } from "@/lib/market";

// Mock del Link de TanStack Router para no necesitar el router completo
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
    className?: string;
  }) => (
    <a href={`${to.replace("$id", params?.id ?? "")}`} {...rest}>
      {children}
    </a>
  ),
}));

/** Vehículo de prueba base (caso feliz) */
function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 42,
    userId: "user-1",
    title: "Mazda CX-30 2022",
    brand: "Mazda",
    model: "CX-30",
    year: 2022,
    mileage: 35000,
    price: 95_000_000,
    condition: "usado",
    fuel: "gasolina",
    transmission: "automatica",
    bodyType: "suv",
    city: "Bogotá",
    description: "Excelente estado",
    imageUrl: "/vehicles/cx30.jpg",
    images: ["/vehicles/cx30.jpg", "/vehicles/cx5.jpg"],
    listingType: "venta",
    status: "activo",
    createdAt: "2025-01-01",
    taxesCurrent: true,
    taxesAmount: 0,
    finesCurrent: true,
    finesAmount: 0,
    swapAny: true,
    swapPrefs: { any: true },
    sellerVerified: true,
    ...overrides,
  };
}

describe("VehicleCard", () => {
  // 1. Caso feliz + datos visibles
  it("muestra título, precio, ciudad y badge de Venta", () => {
    const vehicle = makeVehicle();

    render(<VehicleCard vehicle={vehicle} />);

    // Queries prioritarias: getByRole / getByText
    expect(
      screen.getByRole("heading", { name: /Mazda CX-30 2022/i }),
    ).toBeInTheDocument();

    // El precio se formatea con formatCop → algo como "$ 95.000.000"
    expect(screen.getByText(/95\.000\.000/)).toBeInTheDocument();

    expect(screen.getByText("Bogotá")).toBeInTheDocument();
    expect(screen.getByText("Venta")).toBeInTheDocument();
    expect(screen.getByText("SUV")).toBeInTheDocument();
  });

  // 2. Estado no feliz / condicional: vendedor NO verificado + una sola foto
  it("no muestra badge Verificado ni contador de fotos cuando no aplica", () => {
    const vehicle = makeVehicle({
      sellerVerified: false,
      images: ["/vehicles/cx30.jpg"], // solo 1 foto → no debe aparecer "X fotos"
    });

    render(<VehicleCard vehicle={vehicle} />);

    // queryBy* porque esperamos que NO exista
    expect(screen.queryByText("Verificado")).not.toBeInTheDocument();
    expect(screen.queryByText(/fotos/i)).not.toBeInTheDocument();
  });

  // 3. Interacción con user-event + badge de Permuta + contador de fotos
  it("muestra badge Permuta, contador de fotos y es clickeable (link)", async () => {
    const user = userEvent.setup();
    const vehicle = makeVehicle({
      listingType: "permuta",
      sellerVerified: true,
      images: ["/a.jpg", "/b.jpg", "/c.jpg"],
    });

    render(<VehicleCard vehicle={vehicle} />);

    // Estado condicional
    expect(screen.getByText("Permuta")).toBeInTheDocument();
    expect(screen.getByText("Verificado")).toBeInTheDocument();
    expect(screen.getByText("3 fotos")).toBeInTheDocument();

    // Interacción: el card es un link
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", expect.stringContaining("42"));

    // Simulamos clic (user-event)
    await user.click(link);
    // No navegamos de verdad porque mockeamos Link, pero el clic no debe lanzar error
  });
});