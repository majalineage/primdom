@echo off
chcp 65001 > nul
echo ========================================================
echo   Публикация проекта PrimDom на GitHub
echo ========================================================
echo.
git push -u origin main
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   УСПЕШНО ОПУБЛИКОВАНО НА GITHUB!
    echo.
    echo   Репозиторий:
    echo   https://github.com/majalineage/primdom
    echo.
    echo   Публичная страница (GitHub Pages):
    echo   https://majalineage.github.io/primdom/
    echo ========================================================
) else (
    echo.
    echo Ошибка отправки. Убедитесь, что на https://github.com/new
    echo создан репозиторий с именем "primdom".
)
pause
