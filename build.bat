@echo off
chcp 65001 >nul
echo Обновление автономного бандла PrimDom...
node scripts/build.js
echo.
echo Готово! Теперь сайт можно открывать напрямую двойным кликом по index.html (без локального сервера).
pause

