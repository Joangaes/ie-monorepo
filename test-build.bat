@echo off
echo 🐳 Testing Docker build with cache busting...

:: Get current timestamp for cache busting
for /f "tokens=*" %%i in ('powershell -command "Get-Date -UFormat %%s"') do set timestamp=%%i

echo Building with POETRY_CACHE_BUSTER=%timestamp%
docker build --build-arg POETRY_CACHE_BUSTER=%timestamp% -t ie-test .

if %errorlevel% neq 0 (
    echo ❌ Docker build failed!
    pause
    exit /b 1
)

echo ✅ Docker build successful!

echo 🧪 Testing Django and Gunicorn imports...
docker run --rm ie-test python -c "import django, gunicorn; print(f'✅ Django {django.get_version()} and Gunicorn imported successfully')"

if %errorlevel% neq 0 (
    echo ❌ Import test failed!
    pause
    exit /b 1
)

echo 🎉 All tests passed!
pause
