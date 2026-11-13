#!/usr/bin/env python3
import io

# Modifier client-layout.tsx pour ajouter le badge de notification
path = "/home/solomon/gaz-point/app/_components/dashboard/client-layout.tsx"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Ajouter l'état pour les notifications non lues
old = "  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);"
new = '''  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(3);'''
content = content.replace(old, new)

# Ajouter le badge de notification dans le header desktop
old = '''              <span className="hidden sm:block font-medium">
                {user?.name || "Utilisateur"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}'''
new = '''              <span className="hidden sm:block font-medium">
                {user?.name || "Utilisateur"}
              </span>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => router.push("/dashboard/notifications")}
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 size-2.5 rounded-full bg-destructive text-white text-[10px] leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleSignOut}'''
content = content.replace(old, new)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Modification terminée pour client-layout.tsx")
