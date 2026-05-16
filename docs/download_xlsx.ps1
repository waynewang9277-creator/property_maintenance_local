$client = New-Object System.Net.WebClient
$url = 'https://unpkg.com/xlsx@0.18.5/dist/xlsx.min.js'
$output = 'E:\openclaw_workspace\property_maintenance_local\frontend\common\js\xlsx.min.js'

Write-Host "Downloading from: $url"
$client.DownloadFile($url, $output)

$size = (Get-Item $output).Length
Write-Host "Downloaded! Size: $size bytes"