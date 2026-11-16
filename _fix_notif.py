#!/usr/bin/env python3
import io

path = "/home/solomon/gaz-point/app/dashboard/notifications/page.tsx"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Ajouter state unreadCount et fonction markAsRead
old = "  const unreadCount = notifications.filter((n) => !n.read).length;"
new = '''  const [unreadCount, setUnreadCount] = useState(notifications.filter((n) => !n.read).length);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };'''
content = content.replace(old, new)

# Remplacer le lien par un bouton qui marque comme lu et navigue
old = '''              <Link key={notif.id} href={notif.link || "#"} className="group">'''
new = '''              <button
                key={notif.id}
                onClick={() => {
                  markAsRead(notif.id);
                  if (notif.link) router.push(notif.link);
                }}
                className="group"
              >'''
content = content.replace(old, new)

# Fermer le button au lieu du Link
old = '''                  </Card>
                </Link>'''
new = '''                  </Card>
                </button>'''
content = content.replace(old, new)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Modification terminée pour notifications/page.tsx")
