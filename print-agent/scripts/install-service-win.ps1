# PowerShell script to register Wrap Nation Print Agent as a Windows Scheduled Task on System Startup
$ErrorActionPreference = "Stop"

$agentDir = Split-Path -Parent $PSScriptRoot
$batchPath = Join-Path $agentDir "scripts\start-agent.bat"

Write-Host "Registering Wrap Nation Print Agent to start automatically on Windows boot..." -ForegroundColor Yellow

$taskName = "WrapNationPrintAgent"
$action = New-ScheduledTaskAction -Execute $batchPath
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Wrap Nation Outbound Thermal Print Agent"
    Write-Host "Task successfully registered! The print agent will now launch automatically when the PC powers on." -ForegroundColor Green
} catch {
    Write-Host "Note: To register startup tasks, run PowerShell as Administrator." -ForegroundColor Red
}
