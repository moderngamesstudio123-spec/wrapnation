@echo off
title Wrap Nation Print Agent
echo Starting Wrap Nation Print Agent...
cd /d "%~dp0\.."
npx tsx src/index.ts
pause
