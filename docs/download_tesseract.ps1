$client = New-Object System.Net.WebClient
$url = 'https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz'
$output = 'E:\openclaw_workspace\property_maintenance_local\frontend\common\models\eng.traineddata.gz'

Write-Host "Downloading from: $url"
$client.DownloadFile($url, $output)

$size = (Get-Item $output).Length
Write-Host "Downloaded! Size: $size bytes"