-- La app valida con zod, pero la tabla no tenía restricciones propias.
-- NOT VALID: no revisa las filas existentes, solo las nuevas o modificadas.
ALTER TABLE vehicles ADD CONSTRAINT vehicles_price_check CHECK (price >= 0) NOT VALID;
ALTER TABLE vehicles ADD CONSTRAINT vehicles_year_check CHECK (year >= 1980) NOT VALID;
ALTER TABLE vehicles ADD CONSTRAINT vehicles_mileage_check CHECK (mileage >= 0) NOT VALID;