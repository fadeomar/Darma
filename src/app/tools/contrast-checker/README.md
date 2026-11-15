# Contrast Checker

أداة مجانية باللغة الإنجليزية على `/tools/contrast-checker`، مبنية داخل قالب أدوات Darma وألوانه الحالية. الحساب والمعاينة والإصلاح والتصدير تعمل محليًا؛ لا API أو DB أو اعتماد جديد.

## الوظائف
- HEX3/4/6/8، RGB/RGBA، HSL/HSLA؛ لا أسماء CSS أو wide-gamut في هذا الإصدار.
- نتائج مستقلة: Normal AA/AAA، Large AA/AAA، Non-text AA.
- شفافية النص فوق خلفية معتمة معلومة؛ المقارنة بالقيمة الدقيقة قبل تنسيق العرض.
- بدائل أفتح/أغمق للون المختار، مع تثبيت اللون الآخر والشفافية، والتحقق من قيمة CSS النهائية قبل إعلان النجاح.
- Apply/Undo، أمثلة، Text/UI previews، EyeDropper عند توفره، وfallback للمدخلات العادية.
- Copy report وShare link وCopy/Download CSS؛ fallback نصي عند تعذر Clipboard.
- رابط المشاركة يحمل اللونين والهدف فقط؛ نص المعاينة لا يدخل الرابط. تُنقّى ألوان المشاركة من page-view URLs في Analytics.

## البنية
- `contrast.ts`: parser، alpha compositing، حساب WCAG، التصنيف، الاقتراحات، المشاركة والمخرجات؛ لا React أو browser API.
- `ContrastCheckerClient.tsx`: واجهة وتفاعلات محلية؛ واجهات المتصفح لا تُستدعى أثناء SSR.
- `contrast.module.css`: تخطيط responsive باستخدام tokens المشروع؛ المعاينة وحدها تحمل ألوان المستخدم.
- `page.tsx`: metadata، shell، شرح ومراجع WCAG.
- التسجيل في `src/features/tools/registry/index.ts` يضيفها إلى الفهرس والبحث وsitemap القائمين.

## الفحص
```bash
npx vitest run src/app/tools/contrast-checker/contrast.test.ts src/lib/analytics/location.test.ts src/features/tools/registry/toolTitles.test.ts src/features/search/publicCopy.contract.test.ts
npm run typecheck
npm run lint
npm run build -- --webpack
```

`#198578` فوق `#FFFFFF` يعطي `4.499139…:1`؛ يجب أن يفشل Normal AA رغم أن التقريب إلى منزلتين يعرض 4.50. هذا ضمن اختبارات الحدود.

لا تعني نتيجة زوج ألوان نجاح صفحة كاملة في accessibility. الصور والـgradients وحالات التفاعل واستخدام اللون وحده تحتاج تقييمًا إضافيًا. لا يوجد حد AAA منفصل لمعيار Non-text contrast.

حالة التنفيذ والأدلة والقيود: `docs/tools/contrast-checker/CURRENT-STATE-AND-NEXT-STEPS.md`.
