-- 1. Make entidad_id nullable in vacantes (proveedores sin entidad asignada pueden publicar)
ALTER TABLE vacantes ALTER COLUMN entidad_id DROP NOT NULL;

-- 2. Relax vacantes insert policy: solo requiere rol proveedor
DROP POLICY IF EXISTS "vacantes_insert_proveedor" ON vacantes;
CREATE POLICY "vacantes_insert_proveedor"
  ON vacantes FOR INSERT
  WITH CHECK (get_my_role() = 'proveedor');

-- 3. Actualizar select/update/delete para que funcionen con entidad_id NULL
DROP POLICY IF EXISTS "vacantes_select_own" ON vacantes;
CREATE POLICY "vacantes_select_own"
  ON vacantes FOR SELECT
  USING (
    (entidad_id IS NOT NULL AND entidad_id = get_my_entidad_id())
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "vacantes_update_own" ON vacantes;
CREATE POLICY "vacantes_update_own"
  ON vacantes FOR UPDATE
  USING (
    get_my_role() IN ('proveedor', 'empresa_privada')
    AND (
      (entidad_id IS NOT NULL AND entidad_id = get_my_entidad_id())
      OR created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "vacantes_delete_borrador" ON vacantes;
CREATE POLICY "vacantes_delete_borrador"
  ON vacantes FOR DELETE
  USING (
    get_my_role() IN ('proveedor', 'empresa_privada')
    AND estado = 'borrador'
    AND (
      (entidad_id IS NOT NULL AND entidad_id = get_my_entidad_id())
      OR created_by = auth.uid()
    )
  );
