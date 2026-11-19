with open('/home/solomon/gaz-point/app/_components/dashboard/admin-layout-new.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

checks = [
    ('EA_MONOGRAM', 'EA_MONOGRAM' in content),
    ('Espace administrateur', 'Espace administrateur' in content),
    ('Search icon', 'Search' in content),
    ('Calendar/Reservations', 'Calendar' in content),
    ('Bell/Notifications', 'Bell' in content),
    ('Avatar/User', 'User' in content),
    ('LogOut', 'LogOut' in content),
    ('Search input', 'type="search"' in content),
    ('Reservations link', '/dashboard/admin/reservations' in content),
    ('Notifications click', 'handleNotificationsClick' in content),
    ('Avatar menu', 'avatarMenuOpen' in content),
    ('Profile link', '/dashboard/admin/profil' in content),
    ('Notifications link', '/dashboard/admin/notifications' in content),
    ('Logout', 'handleSignOut' in content),
]

for name, result in checks:
    status = 'OK' if result else 'MISSING'
    print('  ' + status + ': ' + name)