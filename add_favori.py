with open('/home/solomon/gaz-point/db/schema.ts', 'r', encoding='utf-8') as f:
    content = f.read()

insert_marker = 'export const relations = defineRelations('
idx = content.find(insert_marker)

if idx >= 0:
    favori_table = '''\n/**
 * Table de liaison pour les favoris (points de vente favoris des clients).
 * Un client peut avoir plusieurs points de vente en favoris.
 */
export const favori = pgTable(
  "favori",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pointId: text("point_id")
      .notNull()
      .references(() => pointDeVente.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("favori_user_point_unique_idx").on(table.userId, table.pointId),
    index("favori_user_id_idx").on(table.userId),
    index("favori_point_id_idx").on(table.pointId),
  ]
)

'''
    new_content = content[:idx] + favori_table + content[idx:]
    
    with open('/home/solomon/gaz-point/db/schema.ts', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Added favori table before relations')
else:
    print('Marker not found')