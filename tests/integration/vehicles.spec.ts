import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import pg from 'pg';

const url = process.env.DATABASE_URL;

// Se salta si no hay BD de pruebas configurada (así el CI actual sigue en verde).
describe.skipIf(!url)('BD real: tabla vehicles', () => {
  let pool: pg.Pool;

  const base = {
    user_id: 'usuario-prueba',
    title: 'Mazda 3 2020',
    brand: 'Mazda',
    model: '3',
    year: 2020,
    mileage: 50000,
    price: 80000000,
    condition: 'used',
    fuel: 'gasoline',
    transmission: 'automatic',
    body_type: 'sedan',
    city: 'Bogotá',
    description: 'Vehículo de prueba',
    image_url: 'https://example.com/foto.jpg',
    listing_type: 'sale',
  };

  async function insertar(fila: Record<string, unknown>) {
    const columnas = Object.keys(fila);
    const marcas = columnas.map((_, i) => `$${i + 1}`);
    return pool.query(
      `INSERT INTO vehicles (${columnas.join(', ')}) VALUES (${marcas.join(', ')}) RETURNING *`,
      Object.values(fila),
    );
  }

  beforeAll(() => {
    // Guardia: nunca correr contra una BD que no sea de pruebas.
    const nombreBd = new URL(url!).pathname.replace('/', '');
    if (!nombreBd.endsWith('_test')) {
      throw new Error(`La BD "${nombreBd}" no termina en _test: se aborta para no tocar datos reales.`);
    }
    pool = new pg.Pool({ connectionString: url, max: 1 });
  });

  // Limpieza explícita: truncado antes de cada test.
  beforeEach(async () => {
    await pool.query('TRUNCATE vehicles RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('rellena los valores por defecto al insertar solo las columnas obligatorias', async () => {
    const { rows } = await insertar(base);
    expect(rows[0]).toMatchObject({ status: 'activo', images: '[]', swap_any: true, free_reactivations_used: 0 });
    expect(rows[0].created_at).toBeInstanceOf(Date);
  });

  it.each(Object.keys(base))('rechaza %s nulo (NOT NULL)', async (columna) => {
    await expect(insertar({ ...base, [columna]: null })).rejects.toMatchObject({
      code: '23502',
      column: columna,
    });
  });

  it.each(['year', 'mileage'])('rechaza %s fuera del rango de integer', async (columna) => {
    await expect(insertar({ ...base, [columna]: 2_147_483_648 })).rejects.toMatchObject({ code: '22003' });
  });

  it('HALLAZGO: la BD acepta valores sin sentido (precio negativo, año 0)', async () => {
    const { rows } = await insertar({ ...base, price: -1, year: 0 });
    expect(rows[0]).toMatchObject({ price: -1, year: 0 });
  });

  it('la limpieza deja la tabla vacía y reinicia los ids', async () => {
    const { rows } = await insertar(base);
    expect(rows[0].id).toBe(1);
  });
});