# Starts the API without --reload. On many Windows systems, `uvicorn --reload` raises
# WinError 10013 (socket permissions). Restart this script manually after you change Python code.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
    Write-Error "Create the venv first: python -m venv .venv && pip install -r requirements.txt"
}
& .\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8765
