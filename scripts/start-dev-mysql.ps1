$ErrorActionPreference = 'Stop'

$version = '8.4.8'
$base = Join-Path $env:LOCALAPPDATA 'tourneo-dev'
$zip = Join-Path $base "mysql-$version-winx64.zip"
$mysql = Join-Path $base "mysql-$version-winx64"
$data = Join-Path $base 'mysql-data'
$outLog = Join-Path $base 'mysql.out.log'
$errLog = Join-Path $base 'mysql.err.log'
$url = "https://cdn.mysql.com/Downloads/MySQL-8.4/mysql-$version-winx64.zip"

New-Item -ItemType Directory -Force -Path $base | Out-Null

if (!(Test-Path $zip)) {
  Write-Host "Downloading portable MySQL $version..."
  curl.exe -L --fail --output $zip $url
}

if (!(Test-Path $mysql)) {
  Write-Host "Extracting portable MySQL..."
  Expand-Archive -Path $zip -DestinationPath $base -Force
}

$mysqld = Join-Path $mysql 'bin\mysqld.exe'
$mysqlCli = Join-Path $mysql 'bin\mysql.exe'

New-Item -ItemType Directory -Force -Path $data | Out-Null

if (!(Test-Path (Join-Path $data 'mysql'))) {
  Write-Host 'Initializing local MySQL data directory...'
  & $mysqld --no-defaults --initialize-insecure --basedir=$mysql --datadir=$data --console
}

$isListening = Test-NetConnection 127.0.0.1 -Port 3306 -InformationLevel Quiet
if (!$isListening) {
  Write-Host 'Starting local MySQL on 127.0.0.1:3306...'
  Start-Process `
    -WindowStyle Hidden `
    -FilePath $mysqld `
    -ArgumentList @('--no-defaults', "--basedir=$mysql", "--datadir=$data", '--port=3306', '--bind-address=127.0.0.1', '--mysqlx=0', '--skip-log-bin') `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog

  $ready = $false
  for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 1
    if (Test-NetConnection 127.0.0.1 -Port 3306 -InformationLevel Quiet) {
      $ready = $true
      break
    }
  }

  if (!$ready) {
    $errTail = if (Test-Path $errLog) { Get-Content $errLog -Tail 80 | Out-String } else { '' }
    throw "MySQL did not become ready. Log:`n$errTail"
  }
}

& $mysqlCli -h 127.0.0.1 -P 3306 -u root -e "CREATE DATABASE IF NOT EXISTS tourneo_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

Write-Host 'Local MySQL is ready on 127.0.0.1:3306, database tourneo_test.'
