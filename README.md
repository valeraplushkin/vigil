# Vigil — UI-каркас (чистый перенос из Replit)

Standalone Expo-приложение. Содержит **только слой представления** Vigil, перенесённый из Replit-сборки и очищенный от монорепо-обвязки и Replit-специфики.

## Запуск

```bash
npx expo install        # доставит/выровняет нативные зависимости под SDK 54
npx expo start
```

> Если `npx expo install` ругается на конфликты — это нормально для первого раза;
> он сам предложит корректные версии. Можно также `npm install` затем `npx expo install --fix`.

## Стек

- Expo SDK 54, React Native 0.81.5, expo-router (file-based), TypeScript 5.9
- Шрифты: Lora (serif — вопросы/editorial) + Inter (UI)
- Иконки: @expo/vector-icons (Feather)
- Хранилище: AsyncStorage (временно, см. ниже)

## Структура

```
app/                — экраны и layout'ы (онбординг A1–A6, табы B1/B2/B5/B7,
                      question B3, report B4, settings B6, privacy)
components/          — 14 переиспользуемых UI-компонентов
constants/colors.ts — дизайн-токены «Тёплый сумрак»
hooks/useColors.ts  — доступ к токенам
context/AppContext  — состояние (ВРЕМЕННАЯ заглушка, см. ниже)
types/index.ts      — доменные типы + пулы вопросов (пулы — заглушка)
```

## ⚠️ Что здесь — заглушка (заменить при разработке)

Это UI-каркас, а не рабочий продукт. Намеренно перенесено «как есть», чтобы экраны
рендерились и кликались, но следующие части — имитация и подлежат замене:

1. **`types/index.ts` → `PASSIVE_QUESTIONS` / `ACTIVE_QUESTIONS`** — 14 захардкоженных
   вопросов. Заменить на реальную генерацию через LLM (серверно, статус `ready`).
2. **`context/AppContext.tsx` → `getRandomQuestion`** — рандом по статике. Заменить.
3. **`app/report.tsx` → `getMirrorText`** и **`app/(tabs)/history.tsx` → `getMirrorWeek`**
   — `if/else` по процентам. Заменить на LLM-синтез.
4. **`context/AppContext.tsx`** целиком — сейчас «псевдо-бэкенд» на AsyncStorage.
   Заменить на реальный слой данных (Supabase) при появлении бэкенда.
5. **`app/report.tsx` → заметка (`note`)** — НЕ сохраняется (баг потери данных). Починить.
6. **Профиль `tone` / `aiContext`** — сохраняются, но ни на что не влияют. Подключить к генерации.
7. **`app/privacy.tsx`** — содержит неверные утверждения о сервере/ИИ/шифровании,
   которых пока нет. Переписать под реальное поведение перед любым показом людям.
8. **Уведомлений нет** — `expo-notifications` не установлен. Это ядро продукта, добавить.

## Что было вычищено при переносе

- pnpm-workspace / монорепо-обвязка, мёртвый бойлерплейт (`api-server`, `db`, `lib/*`, `mockup-sandbox`)
- `catalog:` и `workspace:*` ссылки в зависимостях → заменены на точные версии
- Replit-овые env-переменные в скрипте `dev` → чистый `expo start`
- `"origin": "https://replit.com/"` из плагина expo-router
- неиспользуемые зависимости (`zod`, `react-native-svg`, Replit-полифиллы)
