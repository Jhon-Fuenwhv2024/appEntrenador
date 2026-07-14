# 026 · Plan

## Enfoque

1. **DDL:** nueva tabla de historial (N:1 con `usuarios` cliente). No sobrecargar `alumnos_info` con un solo snapshot: el valor de producto es la serie temporal.
2. **Backend:** módulo dedicado `modules/body-composition` (o submódulo bajo `clients`) con Route → Controller → Service. Skills: `express-mysql-backend` + `auth-roles-security`.
3. **Contratos:**
   - Trainer: `/api/clients/:clientId/body-composition` — GET list, POST create, PATCH/:id update (y DELETE solo si se acuerda; por defecto soft-omitir delete en MVP).
   - Client: `/api/me/body-composition` — GET list (y query `?latest=1` opcional).
4. **IMC:** preferir cálculo en service cuando existan `height_cm` + `weight_kg` (`weight / (height_m²)`); persistir el valor calculado para lecturas estables. Si falta altura, `bmi` puede ser null.
5. **Altura:** permitir en cada registro; si el form trainer omite altura, reutilizar la del último log del mismo alumno (documentar en data-flows).
6. **Frontend trainer:** panel en ficha alumno (junto a perfil 020 / historial 012/021) — form + lista cronológica.
7. **Frontend client:** sección solo lectura; si 021 ya expone “Mi progreso”, añadir pestaña/bloque **Composición corporal** sin mezclar dominio de workouts en el mismo endpoint.
8. **UI:** skill `vue-best-practices`; Composition API + `<script setup>`; menús/selects con `tf-overlay-menu` si aplica.

## Schema propuesto (borrador)

```sql
CREATE TABLE body_composition_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  recorded_by INT NOT NULL,
  measured_at DATE NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  height_cm DECIMAL(5,2) NULL,
  body_fat_pct DECIMAL(4,2) NULL,
  bmi DECIMAL(4,2) NULL,
  muscle_mass_kg DECIMAL(5,2) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bcl_client_measured (client_id, measured_at),
  CONSTRAINT fk_bcl_client FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_bcl_recorder FOREIGN KEY (recorded_by) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
```

Ajustar nombres/tipos al implementar; actualizar `script_db.sql` y `docs/database-schema.md` en la misma tarea.

## Seguridad

- Trainer write: verificar `client.trainer_id === req.user.id` y rol `trainer`.
- Client read: filtrar solo `client_id = req.user.id`; nunca aceptar `clientId` del body para lecturas propias.
- No endpoints abiertos “porque es local”.

## Component map

- **BodyCompositionPanel** (trainer) — form + historial; props in / emit save.
- **BodyCompositionReadOnly** (client) — último + lista.
- Contenedores: ficha alumno / vista progreso cliente.

## Relación con 021

No bloquea ni amplía el scope de 021. Si 021 ya tiene shell “Mi progreso”, 026 solo engancha un bloque de lectura. Si 021 aún no existe, el cliente puede ver composición en dashboard hasta que exista esa ruta.
