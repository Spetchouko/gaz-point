#!/usr/bin/env python3
import io

# 1. Modifier notifications/page.tsx pour ajouter un vrai système de notifications
path = "/home/solomon/gaz-point/app/dashboard/notifications/page.tsx"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Remplacer les données statiques par un état géré
old = '''  const [filterType, setFilterType] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const notifications: Notification[] = [
    { id: "1", type: "reservation", title: "Réservation confirmée", message: "Votre réservation GP-2024-001234 a été confirmée chez Total Bonamoussadi.", read: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), link: "/dashboard/reservations" },
    { id: "2", type: "availability", title: "Nouvelle disponibilité", message: "Total Bonamoussadi a maintenant des bouteilles 12,5 kg disponibles.", read: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), link: "/dashboard/recherches" },
    { id: "3", type: "system", title: "Mise à jour du service", message: "Une nouvelle version de l'application est disponible avec des améliorations.", read: false, createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString() },
    { id: "4", type: "promo", title: "Offre spéciale", message: "Profitez de -10% sur vos réservations cette semaine.", read: true, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), link: "/dashboard/recherches" },
    { id: "5", type: "reservation", title: "Réservation expirée", message: "Votre réservation GP-2024-001230 a expiré sans être récupérée.", read: true, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), link: "/dashboard/reservations" },
    { id: "6", type: "availability", title: "Stock mis à jour", message: "Bocom Makepe a mis à jour son stock de bouteilles 6 kg.", read: false, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), link: "/dashboard/recherches" },
  ];'''

new = '''  const [filterType, setFilterType] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "1", type: "reservation", title: "Réservation confirmée", message: "Votre réservation GP-2024-001234 a été confirmée chez Total Bonamoussadi.", read: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), link: "/dashboard/reservations" },
    { id: "2", type: "availability", title: "Nouvelle disponibilité", message: "Total Bonamoussadi a maintenant des bouteilles 12,5 kg disponibles.", read: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), link: "/dashboard/recherches" },
    { id: "3", type: "system", title: "Mise à jour du service", message: "Une nouvelle version de l'application est disponible avec des améliorations.", read: false, createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString() },
    { id: "4", type: "promo", title: "Offre spéciale", message: "Profitez de -10% sur vos réservations cette semaine.", read: true, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), link: "/dashboard/recherches" },
    { id: "5", type: "reservation", title: "Réservation expirée", message: "Votre réservation GP-2024-001230 a expiré sans être récupérée.", read: true, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), link: "/dashboard/reservations" },
    { id: "6", type: "availability", title: "Stock mis à jour", message: "Bocom Makepe a mis à jour son stock de bouteilles 6 kg.", read: false, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), link: "/dashboard/recherches" },
  ]);'''

content = content.replace(old, new)

# Ajouter une fonction pour marquer comme lu
old = '''  const unreadCount = notifications.filter((n) => !n.read).length;'''

new = '''  const [unreadCount, setUnreadCount] = useState(notifications.filter((n) => !n.read).length);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };'''

content = content.replace(old, new)

# Remplacer le rendu de la notification pour ajouter le clic
old = '''                <Link key={notif.id} href={notif.link || "#"} className="group">
                  <Card
                    className={cn(
                      "transition-all hover:shadow-md",
                      notif.read ? "" : "border-primary/30 bg-primary/5"
                    )}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {(() => {
                            switch (notif.type) {
                              case "reservation": return <Calendar className="size-4 text-blue-500" />;
                              case "availability": return <Package className="size-4 text-green-500" />;
                              case "system": return <Shield className="size-4 text-gray-500" />;
                              case "promo": return <AlertCircle className="size-4 text-amber-500" />;
                              default: return <Bell className="size-4 text-gray-500" />;
                            }
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={cn("font-medium text-foreground", !notif.read && "font-semibold")}>
                                  {notif.title}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {(() => {
                                    switch (notif.type) {
                                      case "reservation": return "Réservation";
                                      case "availability": return "Disponibilité";
                                      case "system": return "Système";
                                      case "promo": return "Promotion";
                                      default: return notif.type;
                                    }
                                  })()}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{notif.message}</p>
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                              {formatDate(notif.createdAt)}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="size-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {'''

new = '''  const [unreadCount, setUnreadCount] = useState(notifications.filter((n) => !n.read).length);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };'''

content = content.replace(old, new)

# Remplacer le rendu de la carte de notification
old_card = '''                <Link key={notif.id} href={notif.link || "#"} className="group">
                  <Card
                    className={cn(
                      "transition-all hover:shadow-md",
                      notif.read ? "" : "border-primary/30 bg-primary/5"
                    )}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {(() => {
                            switch (notif.type) {
                              case "reservation": return <Calendar className="size-4 text-blue-500" />;
                              case "availability": return <Package className="size-4 text-green-500" />;
                              case "system": return <Shield className="size-4 text-gray-500" />;
                              case "promo": return <AlertCircle className="size-4 text-amber-500" />;
                              default: return <Bell className="size-4 text-gray-500" />;
                            }
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={cn("font-medium text-foreground", !notif.read && "font-semibold")}>
                                  {notif.title}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {(() => {
                                    switch (notif.type) {
                                      case "reservation": return "Réservation";
                                      case "availability": return "Disponibilité";
                                      case "system": return "Système";
                                      case "promo": return "Promotion";
                                      default: return notif.type;
                                    }
                                  })()}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{notif.message}</p>
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                              {formatDate(notif.createdAt)}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="size-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>'''

new_card = '''                <button
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  onClick={() => router.push(notif.link || "/dashboard/notifications")}
                  className="group"
                >
                  <Card
                    className={cn(
                      "transition-all hover:shadow-md cursor-pointer",
                      notif.read ? "" : "border-primary/30 bg-primary/5"
                    )}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {(() => {
                            switch (notif.type) {
                              case "reservation": return <Calendar className="size-4 text-blue-500" />;
                              case "availability": return <Package className="size-4 text-green-500" />;
                              case "system": return <Shield className="size-4 text-gray-500" />;
                              case "promo": return <AlertCircle className="size-4 text-amber-500" />;
                              default: return <Bell className="size-4 text-gray-500" />;
                            }
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={cn("font-medium text-foreground", !notif.read && "font-semibold")}>
                                  {notif.title}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {(() => {
                                    switch (notif.type) {
                                      case "reservation": return "Réservation";
                                      case "availability": return "Disponibilité";
                                      case "system": return "Système";
                                      case "promo": return "Promotion";
                                      default: return notif.type;
                                    }
                                  })()}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{notif.message}</p>
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                              {formatDate(notif.createdAt)}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="size-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>'''

content = content.replace(old_card, new_card)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Modification terminée pour notifications/page.tsx")
