# **App Name**: Roommate Rendezvous

## Core Features:

- User Authentication: Secure user authentication using Firebase Authentication (email & password).
- Expense Logging: Users can log expenses with descriptions, amounts, and participant selection.
- Automated Expense Sharing and Balancing: Automatically divide expenses among selected users and update balances, using Firestore to store transactions.
- Balance Display: Display a clear, up-to-date overview of who owes whom, with real-time updates via Firestore listeners.
- User Debt Settlement: AI tool suggests optimal debt settlement strategies by taking into account how much a given user owes each of the others. Simplifies the transfers such that the minimum number of payment requests can settle all outstanding balances.
- Real-time Notifications: Sends real-time updates when new expenses are added or balances change via Firestore triggers.

## Style Guidelines:

- Primary color: Soft lavender (#E6E6FA) for a calm and balanced feel, reflecting shared harmony.
- Background color: Light gray (#F5F5F5) for a clean and unobtrusive backdrop.
- Accent color: Pale rose (#F0B2B6) for highlights and calls to action.
- Body and headline font: 'PT Sans' for a modern and approachable look.
- Simple, consistent icons for categories and actions, enhancing usability.
- Clean and intuitive layout, optimized for mobile responsiveness, with clear sections for expenses and balances.
- Subtle transitions and animations for balance updates, providing a sense of real-time interactivity.