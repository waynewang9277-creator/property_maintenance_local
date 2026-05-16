$content = [System.IO.File]::ReadAllText('E:\openclaw_workspace\property_maintenance_local\frontend\modules\elevator-handrail-fault\module.js', [System.Text.Encoding]::UTF8)
$opens = ($content.ToCharArray() | Where-Object { $_ -eq '{' }).Count
$closes = ($content.ToCharArray() | Where-Object { $_ -eq '}' }).Count
Write-Host "Opens: $opens, Closes: $closes"

$equals = ($content.ToCharArray() | Where-Object { $_ -eq '=' }).Count
Write-Host "Equals: $equals"
