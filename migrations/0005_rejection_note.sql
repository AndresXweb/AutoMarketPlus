-- Motivo de rechazo de anuncios (admin -> vendedor)
-- Solo ALTER: evita COMMENT ON (falla en algunos PGLite y revierte el ADD COLUMN)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rejection_note text;
