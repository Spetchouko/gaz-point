$ErrorActionPreference = "Stop"
$file1 = "/home/solomon/gaz-point/app/admin/(protected)/clients/page.tsx"
(Get-Content $file1) -replace ', notInArray', '' | Set-Content $file1

$file2 = "/home/solomon/gaz-point/app/_components/admin-clients-table.tsx"
$content = Get-Content $file2
# Remove statusColor block
$content = $content | Where-Object { $_ -notmatch '^\s*const statusColor' -and $_ -notmatch 'active:.*border-success.*$' -and $_ -notmatch 'inactive:.*border-destructive.*$' }
# Remove currentUserId line
$content = $content | Where-Object { $_ -notmatch '^\s+currentUserId,' }
Set-Content $file2 $content
echo "Lint fixes applied."