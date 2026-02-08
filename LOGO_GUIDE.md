# 🎨 Adding Your Custom Logo to IDKPay

## 📁 Step 1: Add Your Logo File

Place your logo file in the **public** folder:

```
e:\studio2\public\
├── logo.png          ← Your main logo (PNG with transparency)
├── logo.svg          ← Vector version (optional, for better quality)
└── favicon.png        ← Favicon version (can be same as logo.png)
```

### Recommended Logo Formats:
- **PNG**: With transparent background, works best
- **SVG**: Vector format, scales perfectly
- **WebP**: Modern format, smaller file size
- **Sizes**: 
  - Header: 32x32px to 48x48px
  - Login/Signup: 48x48px to 64x64px

## 🔄 Step 2: Update Logo Usage

I've created a `Logo` component for you. Now let's update the places where the current Scale icon is used:

### 1. Update Header Component
Replace the Scale icon in `src/components/header.tsx`:

```typescript
// BEFORE (line 34):
<Scale className="h-6 w-6 mr-2 text-primary" />

// AFTER:
<Logo size="md" className="mr-2" />
```

### 2. Update Login Page
Replace in `src/app/login/page.tsx` (line 82):

```typescript
// BEFORE:
<Scale className="w-12 h-12 text-primary"/>

// AFTER:
<Logo size="lg" />
```

### 3. Update Signup Page
Replace in `src/app/signup/page.tsx` (line 193):

```typescript
// BEFORE:
<Scale className="w-12 h-12 text-primary"/>

// AFTER:
<Logo size="lg" />
```

## 🛠️ Step 3: Import the Logo Component

Add this import to each file you update:

```typescript
import { Logo } from '@/components/logo';
```

## 🎯 Step 4: Alternative - Text Logo

If you prefer a text-based logo, use the `TextLogo` component:

```typescript
import { TextLogo } from '@/components/logo';

// Use instead of the Scale icon:
<TextLogo className="text-2xl" />
```

## 📱 Step 5: Update Favicon (Optional)

Add favicon to your layout in `src/app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: 'IDKPay',
  description: 'Shared expense manager for roommates.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};
```

**Note**: Using `logo.png` instead of `favicon.ico` for consistency with your main logo.

## 🎨 Logo Design Tips

### For Student Expense Tracking App:
- **Simple & Clean**: Easy to recognize at small sizes
- **Money/Finance Theme**: Could include $, 💰, receipt, or calculator elements
- **Student-Friendly**: Modern, approachable design
- **Color Scheme**: Match your app's primary color (currently blue/primary)

### Ideas:
- **IDK** letters with payment symbols
- **Wallet or purse icon**
- **Calculator with student cap**
- **Split arrow showing money division**
- **Simple text logo with custom typography

## 🔧 Quick Implementation

### Option 1: Ready-to-Use Logo Component
```typescript
// Just add your logo.png to public folder
// The Logo component will automatically use it
<Logo size="md" />
```

### Option 2: Direct Image Usage
```typescript
import Image from 'next/image';

<Image
  src="/your-logo.png"
  alt="IDKPay"
  width={32}
  height={32}
  className="object-contain"
/>
```

### Option 3: SVG Logo (Best Quality)
```typescript
// Add your logo.svg to public folder
<Image
  src="/logo.svg"
  alt="IDKPay"
  width={32}
  height={32}
  className="object-contain"
/>
```

## 🚀 After Adding Logo

1. **Test locally**: `npm run dev`
2. **Check all pages**: Header, login, signup
3. **Test responsiveness**: Mobile, tablet, desktop
4. **Build test**: `npm run build` (shouldn't break)
5. **Deploy**: Your logo will appear in production

## 🎉 Current Logo Locations

Your logo will appear in:
- ✅ **Header**: Top-left corner (all pages)
- ✅ **Login Page**: Center of login form
- ✅ **Signup Page**: Center of signup form
- ✅ **Browser Tab**: As favicon (if added)

## 📞 Need Help?

If you need help with:
1. **Logo design**: I can suggest design ideas
2. **File format**: Help converting your logo
3. **Sizing issues**: Adjust logo dimensions
4. **Positioning**: Fine-tune logo placement

Just let me know! 🎨

---

**Next Steps:**
1. Add your logo file to `public/` folder
2. I'll help you update the components
3. Test and deploy! 🚀
