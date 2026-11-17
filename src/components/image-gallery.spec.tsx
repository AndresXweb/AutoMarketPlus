import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageGallery } from "./image-gallery";

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

describe("ImageGallery", () => {
  // 1. Estado vacío (no feliz)
  it("sin imágenes no muestra controles ni botones de navegación", () => {
    const { container } = render(<ImageGallery images={[]} alt="Sin fotos" />);

    expect(screen.queryByRole("button", { name: /ampliar foto/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /foto siguiente/i })).not.toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  // 2. Caso feliz: una imagen, sin flechas
  it("con una imagen muestra el alt y no muestra siguiente/anterior", () => {
    render(<ImageGallery images={["/a.jpg"]} alt="Mazda CX-30" />);

    expect(screen.getByRole("img", { name: /mazda cx-30/i })).toHaveAttribute("src", "/a.jpg");
    expect(screen.queryByRole("button", { name: /foto siguiente/i })).not.toBeInTheDocument();
  });

  // 3. Interacción: siguiente cambia la foto y abrir zoom
  it("navega a la siguiente foto y abre el visor al ampliar", async () => {
    const user = userEvent.setup();
    render(
      <ImageGallery images={["/a.jpg", "/b.jpg", "/c.jpg"]} alt="Galería demo" />,
    );

    expect(screen.getByRole("img", { name: /galería demo/i })).toHaveAttribute("src", "/a.jpg");

    await user.click(screen.getByRole("button", { name: /foto siguiente/i }));
    expect(screen.getByRole("img", { name: /galería demo/i })).toHaveAttribute("src", "/b.jpg");

    await user.click(screen.getByRole("button", { name: /ampliar foto/i }));
    expect(screen.getByRole("button", { name: /cerrar/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cerrar/i }));
    expect(screen.queryByRole("button", { name: /cerrar/i })).not.toBeInTheDocument();
  });
});